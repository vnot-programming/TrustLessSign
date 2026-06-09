<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Services\PKI\CAManager;
use Illuminate\Http\Request;
use Exception;

class CertificateController extends Controller
{
    protected CAManager $caManager;

    public function __construct(CAManager $caManager)
    {
        $this->caManager = $caManager;
    }

    /**
     * Download the Root CA Certificate (Public)
     */
    public function downloadRootCert()
    {
        $path = base_path('pki-keys/root_ca.crt');
        if (!file_exists($path)) {
            return response()->json(['message' => 'Root CA not found. App needs to be bootstrapped by admin.'], 404);
        }

        return response()->download($path, 'root_ca.crt', [
            'Content-Type' => 'application/x-x509-ca-cert',
        ]);
    }

    /**
     * Download Certificate Revocation List (CRL) (Public)
     */
    public function downloadCrl()
    {
        $revokedSerials = Certificate::where('is_revoked', true)
            ->select('serial_number', 'revoked_at', 'revoke_reason')
            ->get();

        return response()->json([
            'crl_name' => 'TrustlessSign CRL',
            'last_update' => now()->toIso8601String(),
            'revoked_certificates' => $revokedSerials->map(fn($c) => [
                'serial_number' => $c->serial_number,
                'revoked_at' => $c->revoked_at->toIso8601String(),
                'reason' => $c->revoke_reason ?? 'Unspecified'
            ])
        ]);
    }

    /**
     * Download specific user certificate (Public)
     */
    public function downloadUserCert($serial)
    {
        $cert = Certificate::where('serial_number', $serial)->first();
        if (!$cert) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        return response($cert->cert_pem, 200)
            ->header('Content-Type', 'application/x-x509-ca-cert')
            ->header('Content-Disposition', 'attachment; filename="cert_' . $serial . '.crt"');
    }

    /**
     * Issue User Certificate from CSR (Authenticated Extension)
     */
    public function issue(Request $request)
    {
        $request->validate([
            'csr_pem' => 'required|string',
        ]);

        try {
            // Automatically revoke existing active certificate if any
            Certificate::where('user_id', $request->user()->id)
                ->where('is_revoked', false)
                ->where('expires_at', '>', now())
                ->update([
                    'is_revoked' => true,
                    'revoked_at' => now(),
                    'revoke_reason' => 'Replaced by user',
                ]);

            // Issue using PKI service
            $certData = $this->caManager->issueUserCertificate($request->user()->id, $request->csr_pem);

            $cert = Certificate::create([
                'user_id' => $request->user()->id,
                'serial_number' => $certData['serial_number'],
                'subject_cn' => $certData['subject_cn'],
                'cert_pem' => $certData['cert_pem'],
                'expires_at' => $certData['expires_at'],
                'is_revoked' => false,
            ]);

            return response()->json([
                'message' => 'Certificate issued successfully.',
                'certificate' => $cert
            ], 201);

        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to issue certificate: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Get active certificate details of currently logged-in user (Authenticated Extension)
     */
    public function myCertificate(Request $request)
    {
        $cert = Certificate::where('user_id', $request->user()->id)
            ->where('is_revoked', false)
            ->where('expires_at', '>', now())
            ->orderBy('issued_at', 'desc')
            ->first();

        if (!$cert) {
            return response()->json(['message' => 'No active certificate found.'], 404);
        }

        return response()->json($cert);
    }

    /**
     * Bootstrap Root CA (Admin Only)
     */
    public function bootstrapCA(Request $request)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden. Admin privilege required.'], 403);
        }

        $request->validate([
            'common_name' => 'nullable|string|max:255',
            'country' => 'nullable|string|size:2',
            'organization' => 'nullable|string|max:255',
        ]);

        try {
            $commonName = $request->input('common_name', 'TrustlessSign Root CA');
            $country = $request->input('country', 'ID');
            $organization = $request->input('organization', 'TrustlessSign');

            $result = $this->caManager->bootstrapCA($commonName, $country, $organization);

            return response()->json([
                'message' => 'Root CA bootstrapped successfully.',
                'root_certificate' => $result['cert']
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Revoke User Certificate (Admin Only)
     */
    public function revoke(Request $request, $serial)
    {
        if (!$request->user() || !$request->user()->is_admin) {
            return response()->json(['message' => 'Forbidden. Admin privilege required.'], 403);
        }

        $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $cert = Certificate::where('serial_number', $serial)->first();
        if (!$cert) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        if ($cert->is_revoked) {
            return response()->json(['message' => 'Certificate is already revoked.'], 400);
        }

        $cert->update([
            'is_revoked' => true,
            'revoked_at' => now(),
            'revoke_reason' => $request->input('reason', 'Revoked by admin'),
        ]);

        return response()->json([
            'message' => 'Certificate revoked successfully.',
            'certificate' => $cert
        ]);
    }
}
