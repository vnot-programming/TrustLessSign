<?php

namespace App\Services\PKI;

use App\Models\Certificate;
use Illuminate\Support\Facades\Storage;
use Exception;

class CAManager
{
    private string $caCertPath;
    private string $caKeyPath;

    public function __construct()
    {
        if (app()->environment('testing')) {
            $this->caCertPath = base_path('pki-keys/test_root_ca.crt');
            $this->caKeyPath = base_path('secrets/test_root_ca_key.pem');
        } else {
            // Root CA is stored in pki-keys and docker secrets
            $this->caCertPath = base_path('pki-keys/root_ca.crt');
            // Actually, the key should be loaded from docker secrets or env
            $this->caKeyPath = base_path('secrets/root_ca_key.pem');
        }
    }

    /**
     * Bootstrap the Root CA if it doesn't exist.
     * Generates a 2048-bit RSA key and a self-signed X.509 certificate.
     */
    public function bootstrapCA(string $commonName = 'TrustlessSign Root CA', string $country = 'ID', string $organization = 'TrustlessSign')
    {
        if (file_exists($this->caCertPath) && file_exists($this->caKeyPath)) {
            throw new Exception("Root CA already exists.");
        }

        $dn = [
            "countryName" => $country,
            "stateOrProvinceName" => "DKI Jakarta",
            "localityName" => "Jakarta",
            "organizationName" => $organization,
            "organizationalUnitName" => "IT Security",
            "commonName" => $commonName,
        ];

        // Generate a new 2048-bit RSA key pair
        $privkey = openssl_pkey_new([
            "private_key_bits" => 2048,
            "private_key_type" => OPENSSL_KEYTYPE_RSA,
        ]);

        if (!$privkey) {
            throw new Exception("Failed to generate private key: " . openssl_error_string());
        }

        // Generate a certificate signing request (CSR)
        $csr = openssl_csr_new($dn, $privkey, ['digest_alg' => 'sha256']);
        if (!$csr) {
            throw new Exception("Failed to generate CSR: " . openssl_error_string());
        }

        // Generate a self-signed cert, valid for 3650 days (10 years)
        $x509 = openssl_csr_sign($csr, null, $privkey, 3650, ['digest_alg' => 'sha256'], time());
        if (!$x509) {
            throw new Exception("Failed to sign root certificate: " . openssl_error_string());
        }

        // Save the private key and certificate
        openssl_pkey_export($privkey, $privKeyOut);
        openssl_x509_export($x509, $certOut);

        if (!is_dir(dirname($this->caCertPath))) {
            mkdir(dirname($this->caCertPath), 0755, true);
        }
        if (!is_dir(dirname($this->caKeyPath))) {
            mkdir(dirname($this->caKeyPath), 0755, true);
        }

        file_put_contents($this->caCertPath, $certOut);
        file_put_contents($this->caKeyPath, $privKeyOut);

        return [
            'cert' => $certOut,
            'key'  => $privKeyOut
        ];
    }

    /**
     * Issue a user certificate from a provided CSR (Certificate Signing Request) in PEM format.
     * Note: User generates keypair and CSR in browser. Server ONLY receives the CSR.
     */
    public function issueUserCertificate(string $userId, string $csrPem, int $validDays = 365)
    {
        if (!file_exists($this->caCertPath) || !file_exists($this->caKeyPath)) {
            throw new Exception("Root CA not found. Please bootstrap CA first.");
        }

        $caCert = file_get_contents($this->caCertPath);
        $caKey = file_get_contents($this->caKeyPath);

        // Parse CSR to extract Subject DN (Optional validation)
        $csrParsed = openssl_csr_get_subject($csrPem);
        if (!$csrParsed) {
            throw new Exception("Invalid CSR provided.");
        }

        $serialNumber = random_int(1000000, 2147483647); // Generate integer serial

        // Sign the CSR with Root CA
        $x509 = openssl_csr_sign(
            $csrPem, 
            $caCert, 
            $caKey, 
            $validDays, 
            ['digest_alg' => 'sha256'],
            $serialNumber // We can pass a serial number as a string in some PHP versions, but let's let PHP handle it or use time if it expects int. Actually PHP openssl_csr_sign serial is an int or hex string. Let's use a simple numeric serial for now if hex fails.
        );

        if (!$x509) {
            throw new Exception("Failed to sign user certificate: " . openssl_error_string());
        }

        openssl_x509_export($x509, $certOut);

        // Read parsed cert details
        $certParsed = openssl_x509_parse($certOut);

        return [
            'cert_pem' => $certOut,
            'serial_number' => (string)($certParsed['serialNumber'] ?? $serialNumber),
            'subject_cn' => $certParsed['subject']['CN'] ?? 'Unknown',
            'expires_at' => date('Y-m-d H:i:s', $certParsed['validTo_time_t']),
        ];
    }
}
