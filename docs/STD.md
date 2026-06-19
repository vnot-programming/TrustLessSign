# Software Test Document (STD) - Verification Checklist

This document tracks verification steps and manual checklists to ensure TrustlessSign meets standard requirements.

## 1. Automated Tests
Run backend Laravel feature tests:
```bash
php artisan test --filter=TrustlessSignApiTest
```

---

## 2. Verification Checklist (Final)

### Infrastructure & Schema
- [x] `/home/vnot/docker/shared/` created and `shared-postgres` container configured.
- [x] Database `trustlesssign` generated with matching schema migrations.
- [x] Seeder `ReasonCategorySeeder` executed to insert default reason codes.

### PKI Security
- [x] Private CA Root Bootstrap functionality operates in `CAManager.php`.
- [x] Public Root CA Cert downloadable from endpoint `/api/pki/root-cert`.
- [x] Certificate validation logic handles validity periods, signatures, and revocation in `CertValidator.php`.

### Chrome Extension Setup
- [x] Manifest MV3 includes localized browser sandbox limits.
- [x] Extension private key persisted using secure `chrome.storage.local`.
- [x] Master Password setup correctly encrypts keys on generation.

### Authenticated Flow
- [x] OAuth social integrations registered (Google, Facebook, Line).
- [x] Google Drive API uploads signed PDFs successfully.
- [x] Document metadata registered on Laravel backend without transferring the PDF content.

### Public Verification
- [x] scan QR redirects to `/verify/{token}` page.
- [x] PDF integrity checking via hash validation runs local client-side comparison.
- [x] Revoked certificates show explicit visual status updates.

## 3. Building Cache
Jika tidak ada perubahan pada Web Dashboard maka lakukan:
```bash
cd /home/vnot/extra_disk/docker-temp/trustlesssign/web && npm run build
```


