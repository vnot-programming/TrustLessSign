<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Exception;

class DocumentController extends Controller
{
    /**
     * List all documents signed by currently logged-in user.
     */
    public function index(Request $request)
    {
        $documents = Document::where('user_id', $request->user()->id)
            ->with(['certificate'])
            ->orderBy('signed_at', 'desc')
            ->get();

        return response()->json($documents);
    }

    /**
     * Register or Update a signed document's metadata (Zero-Trust).
     * Since the PDF itself never touches the server, this stores only metadata.
     * Supports deferred upload: user can register with is_saved_to_drive = false,
     * and update it later with the GDrive URL once uploaded.
     */
    public function register(Request $request)
    {
        $request->validate([
            'certificate_serial' => 'required|string',
            'is_saved_to_drive' => 'required|boolean',
            'gdrive_url_signed' => 'required_if:is_saved_to_drive,true|nullable|url',
            'original_filename' => 'required|string|max:500',
            'verify_token' => 'required|string|max:128',
            'doc_hash_sha256' => 'required|string|size:64',
            'qr_position' => 'nullable|array',
            'reason_sub_category_id' => 'nullable|integer|exists:reason_sub_categories,id',
            'reason_final' => 'nullable|string|max:1000',
            'notes' => 'nullable|string',
        ]);

        try {
            $cert = Certificate::where('serial_number', $request->certificate_serial)->first();
            if (!$cert) {
                return response()->json(['message' => 'Certificate not found.'], 404);
            }

            // Verify certificate belongs to current user
            if ($cert->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized. Certificate does not belong to you.'], 403);
            }

            // Check if document already exists by verify_token
            $existingDoc = Document::where('verify_token', $request->verify_token)->first();

            if ($existingDoc) {
                // Verify ownership for update
                if ($existingDoc->user_id !== $request->user()->id) {
                    return response()->json(['message' => 'Unauthorized. This token belongs to another user.'], 403);
                }

                // Update is_saved_to_drive and gdrive_url_signed
                $existingDoc->update([
                    'gdrive_url_signed' => $request->gdrive_url_signed ?? $existingDoc->gdrive_url_signed,
                    'is_saved_to_drive' => $request->is_saved_to_drive,
                    'notes' => $request->notes ?? $existingDoc->notes,
                ]);

                return response()->json([
                    'message' => 'Document metadata updated successfully.',
                    'document' => $existingDoc
                ]);
            }

            // Create new document entry
            $document = Document::create([
                'user_id' => $request->user()->id,
                'certificate_id' => $cert->id,
                'reason_sub_category_id' => $request->reason_sub_category_id,
                'gdrive_url_signed' => $request->gdrive_url_signed,
                'is_saved_to_drive' => $request->is_saved_to_drive,
                'original_filename' => $request->original_filename,
                'verify_token' => $request->verify_token,
                'doc_hash_sha256' => $request->doc_hash_sha256,
                'qr_position' => $request->qr_position,
                'reason_final' => $request->reason_final,
                'notes' => $request->notes,
                'signed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Document signed metadata registered successfully.',
                'document' => $document
            ], 201);

        } catch (Exception $e) {
            return response()->json(['message' => 'Failed to register document: ' . $e->getMessage()], 400);
        }
    }
}
