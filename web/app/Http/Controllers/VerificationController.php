<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\PKI\CertValidator;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    protected CertValidator $certValidator;

    public function __construct(CertValidator $certValidator)
    {
        $this->certValidator = $certValidator;
    }

    /**
     * Get document verification metadata by token (Public, Rate Limited)
     */
    public function getVerificationData($token)
    {
        // Remove TLS- prefix if present, and convert to lowercase for matching UUID
        $queryToken = strtolower(str_replace('TLS-', '', strtoupper($token)));
        
        // The short ID from QR code is 8 characters (first segment of UUID).
        // If it's a short ID (with or without TLS-) use LIKE query.
        if (strlen($queryToken) <= 8 || str_starts_with(strtoupper($token), 'TLS-')) {
            $document = Document::where('verify_token', 'LIKE', $queryToken . '%')
                ->with(['user', 'certificate'])
                ->first();
        } else {
            $document = Document::where('verify_token', $token)
                ->with(['user', 'certificate'])
                ->first();
        }

        if (!$document) {
            return response()->json([
                'status' => 'error',
                'message' => 'Document verification token is invalid or does not exist.'
            ], 404);
        }

        // Validate if document is saved to drive
        if (!$document->is_saved_to_drive) {
            return response()->json([
                'status' => 'error',
                'message' => 'Dokumen Tidak Valid (Belum Tersimpan). Please save the document to Google Drive first.'
            ], 400);
        }

        // Validate the user certificate associated with the signature
        $certValidation = $this->certValidator->validateCertificate($document->certificate->cert_pem);

        $certStatus = 'valid';
        $validationError = null;

        if (!$certValidation['valid']) {
            $validationError = $certValidation['reason'];
            if (str_contains(strtolower($validationError), 'expired')) {
                $certStatus = 'expired';
            } elseif (str_contains(strtolower($validationError), 'revoked')) {
                $certStatus = 'revoked';
            } else {
                $certStatus = 'invalid';
            }
        }

        // [Trustless] Menentukan status kriptografis dokumen.
        $documentStatus = 'verified';
        if (!$certValidation['valid']) {
            $documentStatus = match($certStatus) {
                'revoked' => 'signed_revoked_cert',
                'expired' => 'signed_expired_cert',
                default   => 'signed_invalid_cert',
            };
        }

        return response()->json([
            'status'          => 'success',       // HTTP level — dokumen ditemukan
            'document_status' => $documentStatus, // Trustless level — status kriptografis
            'document' => [
                'id' => $document->id,
                'original_filename' => $document->original_filename,
                'doc_hash_sha256' => $document->doc_hash_sha256,
                'gdrive_url_signed' => $document->gdrive_url_signed,
                'is_saved_to_drive' => $document->is_saved_to_drive,
                'reason' => $document->reason_final ?? 'Digital Verification',
                'signed_at' => $document->signed_at->toIso8601String(),
                'notes' => $document->notes,
            ],
            'signer' => [
                'name' => $document->user->name,
                'email' => $document->user->email,
                'avatar' => $document->user->avatar,
            ],
            'certificate' => [
                'serial_number' => $document->certificate->serial_number,
                'subject_cn' => $document->certificate->subject_cn,
                'expires_at' => $document->certificate->expires_at->toIso8601String(),
                'status' => $certStatus,
                'validation_error' => $validationError,
            ]
        ]);
    }
}
