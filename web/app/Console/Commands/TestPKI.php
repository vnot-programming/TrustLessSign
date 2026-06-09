<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PKI\CAManager;

class TestPKI extends Command
{
    protected $signature = 'pki:test';
    protected $description = 'Test PKI CAManager functionality';

    public function handle()
    {
        $ca = new CAManager();
        
        $this->info("Bootstrapping CA...");
        try {
            $caData = $ca->bootstrapCA();
            $this->info("Root CA created successfully.");
        } catch (\Exception $e) {
            $this->warn("CA Bootstrap: " . $e->getMessage());
        }

        $this->info("Generating a dummy user CSR...");
        $privkey = openssl_pkey_new(["private_key_bits" => 2048, "private_key_type" => OPENSSL_KEYTYPE_RSA]);
        $dn = ["countryName" => "ID", "commonName" => "Budi Santoso"];
        $csr = openssl_csr_new($dn, $privkey, ['digest_alg' => 'sha256']);
        openssl_csr_export($csr, $csrPem);

        $this->info("Issuing Certificate...");
        $certData = $ca->issueUserCertificate("test-uuid", $csrPem);
        
        $this->info("Certificate issued! Serial: " . $certData['serial_number']);
        $this->info("Expires at: " . $certData['expires_at']);
        $this->info("Subject CN: " . $certData['subject_cn']);
    }
}
