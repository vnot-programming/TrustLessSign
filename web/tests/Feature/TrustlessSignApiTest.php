<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Certificate;
use App\Models\Document;
use App\Models\ReasonCategory;
use App\Models\ReasonSubCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrustlessSignApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        @unlink(base_path('pki-keys/test_root_ca.crt'));
        @unlink(base_path('secrets/test_root_ca_key.pem'));

        // Seed reason categories and subcategories
        $cat = ReasonCategory::create([
            'name_en' => 'Legal & Official',
            'name_id' => 'Legalitas & Dokumen Resmi',
            'name_th' => 'เอกสารทางกฎหมายและเป็นทางการ',
            'sort_order' => 1,
        ]);

        ReasonSubCategory::create([
            'category_id' => $cat->id,
            'reason_text_en' => 'I approve this document',
            'reason_text_id' => 'Saya menyetujui dokumen ini',
            'reason_text_th' => 'ฉันอนุมัติเอกสารนี้',
            'is_custom' => false,
            'sort_order' => 1,
        ]);
    }

    protected function tearDown(): void
    {
        @unlink(base_path('pki-keys/test_root_ca.crt'));
        @unlink(base_path('secrets/test_root_ca_key.pem'));
        parent::tearDown();
    }

    public function test_full_trustless_sign_lifecycle()
    {
        // 1. Create users (admin and normal user)
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@trustlesssign.local',
            'password' => bcrypt('password123'),
            'is_admin' => true,
        ]);

        $user = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@trustlesssign.local',
            'password' => bcrypt('password123'),
            'is_admin' => false,
        ]);

        // Generate Sanctum tokens
        $userToken = $user->createToken('TestExtension')->plainTextToken;
        $adminToken = $admin->createToken('TestAdmin')->plainTextToken;

        // 2. Admin bootstraps Root CA
        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson('/api/pki/bootstrap', [
                'common_name' => 'TrustlessSign Root CA Test',
                'country' => 'ID',
                'organization' => 'TrustlessSign Test Org',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'root_certificate']);
        $this->assertFileExists(base_path('pki-keys/test_root_ca.crt'));
        $this->assertFileExists(base_path('secrets/test_root_ca_key.pem'));

        // 3. Download Root CA Certificate publicly
        $response = $this->get('/api/pki/root-cert');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/x-x509-ca-cert');

        // 4. Generate user CSR and request user certificate
        $privkey = openssl_pkey_new([
            'private_key_bits' => 2048,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ]);
        $dn = [
            "countryName" => "ID",
            "stateOrProvinceName" => "Jakarta",
            "localityName" => "Jakarta",
            "organizationName" => "TrustlessSign User Org",
            "commonName" => "Budi Santoso",
        ];
        $csr = openssl_csr_new($dn, $privkey, ['digest_alg' => 'sha256']);
        openssl_csr_export($csr, $csrPem);

        $response = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->postJson('/api/certificates/issue', [
                'csr_pem' => $csrPem,
            ]);

        if ($response->status() !== 201) {
            dump($response->json());
        }

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'certificate' => ['id', 'serial_number', 'subject_cn', 'cert_pem', 'expires_at']
        ]);

        $serial = $response->json('certificate.serial_number');

        // Get user's own certificate
        $response = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->getJson('/api/certificates/me');
        $response->assertStatus(200);
        $response->assertJsonFragment(['serial_number' => $serial]);

        // Download user certificate publicly
        $response = $this->get("/api/certificates/{$serial}/download");
        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="cert_' . $serial . '.crt"');

        // 5. Fetch Reason Categories
        $response = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->getJson('/api/reasons/categories');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['name_en' => 'Legal & Official']);

        // 6. Register a signed document with deferred GDrive upload (is_saved_to_drive = false)
        $verifyToken = 'verify_token_xyz_123';
        $docHash = hash('sha256', 'dummy_pdf_content');
        $subCat = ReasonSubCategory::first();

        $response = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->postJson('/api/documents/register', [
                'certificate_serial' => $serial,
                'is_saved_to_drive' => false,
                'gdrive_url_signed' => null,
                'original_filename' => 'surat-keputusan.pdf',
                'verify_token' => $verifyToken,
                'doc_hash_sha256' => $docHash,
                'qr_position' => ['page' => 1, 'x' => 100, 'y' => 150, 'size' => 80],
                'reason_sub_category_id' => $subCat->id,
                'reason_final' => 'I approve this document: Surat Keputusan No. 001',
                'notes' => 'Test document',
            ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['is_saved_to_drive' => false]);

        // Verify public verify endpoint returns "Unsaved" state
        $response = $this->getJson("/api/verify/{$verifyToken}");
        $response->assertStatus(400);
        $response->assertJsonFragment(['status' => 'error', 'message' => 'Dokumen Tidak Valid (Belum Tersimpan). Please save the document to Google Drive first.']);

        // 7. Update document once uploaded to Google Drive
        $gdriveUrl = 'https://drive.google.com/file/d/12345abcdef/view';
        $response = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->postJson('/api/documents/register', [
                'certificate_serial' => $serial,
                'is_saved_to_drive' => true,
                'gdrive_url_signed' => $gdriveUrl,
                'original_filename' => 'surat-keputusan.pdf',
                'verify_token' => $verifyToken,
                'doc_hash_sha256' => $docHash,
                'qr_position' => ['page' => 1, 'x' => 100, 'y' => 150, 'size' => 80],
                'reason_sub_category_id' => $subCat->id,
                'reason_final' => 'I approve this document: Surat Keputusan No. 001',
                'notes' => 'Test document',
            ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['is_saved_to_drive' => true, 'gdrive_url_signed' => $gdriveUrl]);

        // Verify public verify endpoint returns "Saved" state
        $response = $this->getJson("/api/verify/{$verifyToken}");
        $response->assertStatus(200);
        $response->assertJsonFragment(['is_saved_to_drive' => true, 'gdrive_url_signed' => $gdriveUrl]);

        // List user's documents
        $response = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->getJson('/api/documents');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['verify_token' => $verifyToken]);

        // 8. Admin revokes the user's certificate
        $response = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->postJson("/api/certificates/revoke/{$serial}", [
                'reason' => 'Compromised key'
            ]);
        $response->assertStatus(200);
        $response->assertJsonFragment(['is_revoked' => true, 'revoke_reason' => 'Compromised key']);

        // Verify public verify endpoint now returns "revoked" certificate status
        $response = $this->getJson("/api/verify/{$verifyToken}");
        $response->assertStatus(200);
        $response->assertJsonPath('certificate.status', 'revoked');
        $response->assertJsonPath('certificate.validation_error', 'Certificate has been revoked: Compromised key');

        // Check CRL public download
        $response = $this->getJson('/api/pki/crl');
        $response->assertStatus(200);
        $response->assertJsonFragment(['serial_number' => $serial, 'reason' => 'Compromised key']);
    }
}
