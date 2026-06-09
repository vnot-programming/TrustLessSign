<?php

namespace App\Services\PKI;

use App\Models\Certificate;
use Exception;

class CertValidator
{
    private string $caCertPath;

    public function __construct()
    {
        if (app()->environment('testing')) {
            $this->caCertPath = base_path('pki-keys/test_root_ca.crt');
        } else {
            $this->caCertPath = base_path('pki-keys/root_ca.crt');
        }
    }

    /**
     * Validate a user certificate PEM.
     * Check if it is signed by Root CA, not expired, and not revoked in DB.
     * 
     * @param string $certPem
     * @return array [ 'valid' => bool, 'reason' => string|null, 'details' => array|null ]
     */
    public function validateCertificate(string $certPem): array
    {
        try {
            // 1. Parse certificate details
            $certParsed = @openssl_x509_parse($certPem);
            if (!$certParsed) {
                return [
                    'valid' => false,
                    'reason' => 'Invalid certificate format or unable to parse PEM.',
                    'details' => null
                ];
            }

            $serialNumber = (string)($certParsed['serialNumber'] ?? '');
            $subjectCN = $certParsed['subject']['CN'] ?? 'Unknown';
            $validTo = $certParsed['validTo_time_t'] ?? 0;
            $validFrom = $certParsed['validFrom_time_t'] ?? 0;

            $details = [
                'serial_number' => $serialNumber,
                'subject_cn' => $subjectCN,
                'valid_from' => date('Y-m-d H:i:s', $validFrom),
                'valid_to' => date('Y-m-d H:i:s', $validTo),
            ];

            // 2. Check Expiration
            $now = time();
            if ($now < $validFrom) {
                return [
                    'valid' => false,
                    'reason' => 'Certificate is not active yet (validFrom in the future).',
                    'details' => $details
                ];
            }
            if ($now > $validTo) {
                return [
                    'valid' => false,
                    'reason' => 'Certificate has expired.',
                    'details' => $details
                ];
            }

            // 3. Verify Signature against Root CA
            if (!file_exists($this->caCertPath)) {
                return [
                    'valid' => false,
                    'reason' => 'Root CA certificate not found on server.',
                    'details' => $details
                ];
            }
            $rootCert = file_get_contents($this->caCertPath);
            
            // openssl_x509_verify returns 1 on success, 0 on failure, -1 on error
            $verifyResult = openssl_x509_verify($certPem, $rootCert);
            if ($verifyResult !== 1) {
                return [
                    'valid' => false,
                    'reason' => 'Certificate signature verification failed (not issued by Root CA).',
                    'details' => $details
                ];
            }

            // 4. Check Revocation in Database (using serial number)
            if ($serialNumber !== '') {
                $dbCert = Certificate::where('serial_number', $serialNumber)->first();
                if ($dbCert && $dbCert->is_revoked) {
                    return [
                        'valid' => false,
                        'reason' => 'Certificate has been revoked: ' . ($dbCert->revoke_reason ?? 'No reason provided'),
                        'details' => array_merge($details, [
                            'revoked_at' => $dbCert->revoked_at,
                            'revoke_reason' => $dbCert->revoke_reason
                        ])
                    ];
                }
            }

            return [
                'valid' => true,
                'reason' => null,
                'details' => $details
            ];

        } catch (Exception $e) {
            return [
                'valid' => false,
                'reason' => 'Error during validation: ' . $e->getMessage(),
                'details' => null
            ];
        }
    }
}
