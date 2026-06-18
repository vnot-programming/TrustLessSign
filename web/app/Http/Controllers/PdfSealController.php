<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Models\SignedDocument;

class PdfSealController extends Controller
{
    /**
     * Seal a signed PDF with AES-256 permission restrictions.
     *
     * POST /api/pdf/seal
     * Body: { pdf_base64: string, verify_token: string, permissions: object }
     *
     * Owner password derivation: SHA256(verify_token + "::" + cert_serial)
     * This is deterministic and reproducible from server-side DB data alone.
     * User password is empty — the PDF can be opened without any password.
     */
    public function seal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pdf_base64'   => 'required|string',
            'verify_token' => 'required|string|uuid',
            'permissions'  => 'required|array',
        ]);

        $pdfBase64   = $validated['pdf_base64'];
        $verifyToken = $validated['verify_token'];
        $permissions = $validated['permissions'];

        // 1. Lookup the document by verify_token to get cert_serial
        $doc = SignedDocument::where('verify_token', $verifyToken)->first();

        if (!$doc) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Document record not found for given verify_token.',
            ], 404);
        }

        $certSerial = $doc->certificate_serial;

        // 2. Derive owner_password: SHA256(verify_token + "::" + cert_serial)
        // This is the same formula that can be reconstructed any time from DB.
        $ownerPassword = hash('sha256', $verifyToken . '::' . $certSerial);

        // 3. Write input PDF to a temp file
        $tmpIn  = tempnam(sys_get_temp_dir(), 'tsign_in_');
        $tmpOut = tempnam(sys_get_temp_dir(), 'tsign_out_');

        try {
            // Decode and write input PDF
            $pdfBytes = base64_decode($pdfBase64);
            if ($pdfBytes === false || strlen($pdfBytes) < 5) {
                throw new \InvalidArgumentException('Invalid base64 PDF data.');
            }
            file_put_contents($tmpIn, $pdfBytes);

            // 4. Build JSON config for the Python script
            $config = json_encode([
                'pdf_base64'     => $pdfBase64,
                'owner_password' => $ownerPassword,
                'permissions'    => $this->sanitizePermissions($permissions),
            ]);

            // 5. Call the Python seal_pdf.py script
            $scriptPath = base_path('app/Scripts/seal_pdf.py');
            $python     = $this->getPythonPath();

            $descriptors = [
                0 => ['pipe', 'r'],  // stdin
                1 => ['pipe', 'w'],  // stdout
                2 => ['pipe', 'w'],  // stderr
            ];

            $process = proc_open(
                escapeshellcmd($python) . ' ' . escapeshellarg($scriptPath),
                $descriptors,
                $pipes
            );

            if (!is_resource($process)) {
                throw new \RuntimeException('Failed to start Python seal process.');
            }

            // Write config JSON to stdin
            fwrite($pipes[0], $config);
            fclose($pipes[0]);

            // Read output
            $stdout = stream_get_contents($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);

            $exitCode = proc_close($process);

            if ($exitCode !== 0) {
                Log::error('seal_pdf.py exited with code ' . $exitCode . ': ' . $stderr);
                throw new \RuntimeException('PDF sealing script failed: ' . $stderr);
            }

            // 6. Parse Python output
            $result = json_decode($stdout, true);

            if (!$result || ($result['status'] ?? '') !== 'success') {
                $msg = $result['message'] ?? 'Unknown error from seal script.';
                throw new \RuntimeException('PDF sealing failed: ' . $msg);
            }

            return response()->json([
                'status'     => 'success',
                'pdf_base64' => $result['pdf_base64'],
            ]);

        } catch (\Throwable $e) {
            Log::error('PdfSealController::seal error: ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 500);
        } finally {
            // Always clean up temp files
            if (file_exists($tmpIn))  @unlink($tmpIn);
            if (file_exists($tmpOut)) @unlink($tmpOut);
        }
    }

    /**
     * Sanitize and cast permissions to boolean values.
     */
    private function sanitizePermissions(array $raw): array
    {
        $allowed = [
            'print_highres', 'print_lowres', 'modify_other',
            'modify_annotation', 'modify_assembly', 'modify_form',
            'extract', 'sign',
        ];

        $result = [];
        foreach ($allowed as $key) {
            $result[$key] = (bool)($raw[$key] ?? false);
        }

        return $result;
    }

    /**
     * Determine which Python binary is available on this system.
     */
    private function getPythonPath(): string
    {
        foreach (['python3', 'python'] as $cmd) {
            $which = trim(shell_exec("which $cmd 2>/dev/null"));
            if (!empty($which)) {
                return $which;
            }
        }

        return 'python3'; // fallback
    }
}
