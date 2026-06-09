# Implementation Plan: TrustlessSign
# Sistem Tanda Tangan Digital Administratif — Private CA
# Versi: 5.0 FINAL — Siap Eksekusi
# Tanggal: 2026-06-09

---

## Identitas Proyek

| Atribut | Detail |
|---------|--------|
| **Nama Proyek** | TrustlessSign |
| **Jenis** | Standalone Monolith — tidak terhubung proyek lain |
| **Workspace Sementara** | `/home/vnot/extra_disk/docker-temp/trustlesssign/` |
| **Workspace Produksi** | `/home/vnot/docker/trustlesssign/` (setelah stabil) |
| **App Port** | Host `8101` → Container `80` ✅ (verified free) |

---

## Prinsip Arsitektur Inti (Zero-Trust Absolut)

> [!IMPORTANT]
> **3 aturan tidak dapat dilanggar:**
> 1. Private key user **TIDAK PERNAH** meninggalkan perangkat — tidak dikirim ke server manapun
> 2. Konten dokumen PDF **TIDAK PERNAH** menyentuh server TrustlessSign — server hanya menerima **URL** GDrive
> 3. Server hanya menyimpan: Public Key (cert PEM) + URL GDrive signed PDF + metadata tanda tangan

---

## Tech Stack (Final)

### 1. Monolith Core — **Laravel 13 (PHP 8.5+)**

Laravel bertindak sebagai **single command center**: mengelola database, logika PKI, autentikasi sosial, REST API untuk extension, sekaligus menyajikan semua halaman web via Inertia.js.

| Layer | Library / Tech | Fungsi |
|-------|---------------|--------|
| **Core Engine** | Laravel 13 (PHP 8.5+) | REST API + Inertia Monolith engine |
| **Database ORM** | Eloquent ORM | Abstraksi PostgreSQL |
| **DB Migration** | Laravel Migrations | Schema versioning (ganti Alembic) |
| **Auth (Web)** | Laravel Session + Breeze | Amankan sesi dashboard web |
| **Auth (Extension)** | Laravel Sanctum | Bearer token stateless untuk Chrome Extension |
| **Social Login** | Laravel Socialite | OAuth 2.0: Google, Facebook, Line (ganti Authlib) |
| **PKI & Crypto** | **Native PHP OpenSSL** | RSA-2048 keygen, X.509 cert, PKCS#12 `.pfx` |
| **API Security** | Laravel Rate Limiter | Throttle di `bootstrap/app.php` (ganti slowapi) |

### 2. Frontend View Layer — **Inertia.js + React 19 (TSX)**

Tidak ada separate deployment. Semua halaman dirender Laravel via Inertia, ditulis sebagai React components.

| Layer | Library / Tech | Fungsi |
|-------|---------------|--------|
| **Bridge** | Inertia.js (React Adapter) | Controller Laravel → React component langsung |
| **UI** | React 19 + TypeScript | Semua halaman `.tsx` |
| **Styling** | **Tailwind CSS v4** | Utility-first, design system |
| **i18n** | Laravel Lang + React Context | Multibahasa (id/en) server-driven |
| **PDF Preview** | react-pdf | Preview PDF + overlay QR position |
| **Drag UI** | react-draggable | Drag & drop posisi QR sebelum signing |

### 3. Client-Side Signer — **Chrome Extension MV3 (Standalone)**

Tetap berdiri mandiri. Inti Zero-Trust — semua proses kriptografi terjadi di perangkat lokal.

| Layer | Library / Tech | Fungsi |
|-------|---------------|--------|
| **Runtime** | Manifest V3 (Chrome API) | Service Worker + Content Script |
| **PDF Engine** | pdf-lib | Embed signature, QR visual, baca struktur PDF |
| **Crypto** | node-forge | RSA-2048 sign, certificate chain, PKCS#12 |
| **Crypto Native** | Web Crypto API | AES-256-GCM key import, native browser |
| **Cloud Bridge** | Google Drive API v3 | Download PDF asli, upload PDF signed |
| **Bundler** | esbuild | Bundle semua library ke satu file ringan |

---

## Struktur Direktori Proyek (Laravel 13 Monolith)

```
/extra_disk/docker-temp/trustlesssign/
│
├── docker-compose.yml
├── .env.example
├── .gitignore             ← Exclude: .env, secrets/, pki-keys/, key.pem
│
├── pki-keys/              ← BACKUP Root CA (gitignored)
│   ├── root_ca.crt        ← Boleh dipublikasikan
│   └── root_ca.key        ← GITIGNORED
│
├── secrets/               ← Docker Secrets (gitignored)
│   └── root_ca_key.pem
│
├── docs/                  ← Sesuai aturan dev-project.md
│   ├── SRS.md
│   ├── SDD.md
│   ├── SRD.md
│   ├── STD.md
│   └── SDP.md             ← Progress log aktif
│
├── app/                   ← Laravel Application Core
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php         ← Email/Pass + Socialite
│   │   │   ├── CertificateController.php  ← Cert management + PKCS#12
│   │   │   ├── DocumentController.php     ← Register URL GDrive + metadata
│   │   │   └── VerificationController.php ← [PUBLIC] QR scan endpoint
│   │   └── Middleware/
│   │       └── HandleInertiaRequests.php  ← Share auth state ke React
│   ├── Models/
│   │   ├── User.php
│   │   ├── Certificate.php
│   │   ├── Document.php
│   │   ├── ReasonCategory.php
│   │   └── ReasonSubCategory.php
│   ├── Providers/
│   │   └── AppServiceProvider.php         ← Registrasi PKI service bindings
│   └── Services/
│       └── PKI/
│           ├── CAManager.php              ← Root CA bootstrap (PHP OpenSSL)
│           └── CertValidator.php          ← Certificate chain validation
│
├── bootstrap/
│   └── app.php                            ← [SLIM CONFIG] Rate limiting, middleware
│
├── config/
│   ├── auth.php
│   ├── services.php                       ← Google, Facebook, Line OAuth credentials
│   └── sanctum.php
│
├── database/
│   ├── migrations/                        ← Laravel Migrations (ganti Alembic)
│   │   ├── create_users_table.php
│   │   ├── create_certificates_table.php
│   │   ├── create_documents_table.php
│   │   ├── create_reason_categories_table.php
│   │   └── create_reason_sub_categories_table.php
│   └── seeders/
│       └── ReasonCategorySeeder.php       ← Seed data default reasons
│
├── resources/
│   ├── js/
│   │   ├── app.tsx                        ← Inertia + React entrypoint
│   │   ├── Components/                    ← Reusable UI components
│   │   └── Pages/                         ← Ganti dari Next.js app/ folder
│   │       ├── LandingPage.tsx
│   │       ├── Auth/
│   │       │   ├── Login.tsx              ← Email/Pass + Google + Facebook + Line
│   │       │   └── Register.tsx
│   │       ├── Dashboard/
│   │       │   ├── Index.tsx              ← Cert & doc management
│   │       │   ├── ConnectGDrive.tsx      ← GDrive OAuth setup
│   │       │   └── SignConfig.tsx         ← QR drag, Reason config
│   │       └── Verify/
│   │           └── PublicLanding.tsx      ← QR Landing page (PUBLIC)
│   └── css/
│       └── app.css                        ← Tailwind CSS v4
│
├── routes/
│   ├── api.php                            ← Stateless API untuk Chrome Extension
│   └── web.php                            ← Stateful web routes (Inertia render)
│
├── tests/
│   ├── Feature/
│   │   ├── AuthApiTest.php
│   │   ├── CertApiTest.php
│   │   └── VerifyApiTest.php
│   └── Unit/
│       └── CAManagerTest.php
│
└── chrome-extension/                      ← STANDALONE — PRIMARY FOCUS
    ├── manifest.json                      ← "key" property untuk lock ID
    ├── key.pem                            ← GITIGNORED
    ├── background/
    │   └── service-worker.js
    ├── popup/
    │   ├── popup.html
    │   ├── popup.js                       ← Login + GDrive onboarding
    │   └── popup.css
    ├── signing/
    │   ├── signer.js                      ← pdf-lib + node-forge RSA-2048
    │   ├── gdrive.js                      ← GDrive API download + upload
    │   └── key-manager.js                 ← storage.local + .p12 export/import
    └── assets/
        └── root_ca.pem                    ← Root CA cert (burned-in)
```

---

## Routing Laravel

### `routes/web.php` (Inertia — Stateful Web)

```php
// Landing & Auth
Route::get('/', fn() => Inertia::render('LandingPage'));
Route::get('/login', fn() => Inertia::render('Auth/Login'));
Route::get('/register', fn() => Inertia::render('Auth/Register'));
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/{provider}', [AuthController::class, 'redirectToProvider']);
Route::get('/auth/{provider}/callback', [AuthController::class, 'handleProviderCallback']);

// Dashboard (auth required)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', fn() => Inertia::render('Dashboard/Index'));
    Route::get('/dashboard/connect-gdrive', fn() => Inertia::render('Dashboard/ConnectGDrive'));
    Route::get('/dashboard/sign', fn() => Inertia::render('Dashboard/SignConfig'));
});

// Public QR Verification
Route::get('/verify/{token}', fn($token) => Inertia::render('Verify/PublicLanding', compact('token')));
```

### `routes/api.php` (Sanctum — Stateless untuk Extension)

```php
// Public endpoints (rate limited)
Route::get('/pki/root-cert', [CertificateController::class, 'downloadRootCert']);
Route::get('/pki/crl', [CertificateController::class, 'downloadCrl']);
Route::get('/verify/{token}', [VerificationController::class, 'getVerificationData']);
Route::get('/certificates/{serial}/download', [CertificateController::class, 'downloadUserCert']);

// Authenticated extension endpoints (Sanctum Bearer)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/certificates/issue', [CertificateController::class, 'issue']);
    Route::get('/certificates/me', [CertificateController::class, 'myChertificate']);
    Route::post('/documents/register', [DocumentController::class, 'register']);
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/reasons/categories', fn() => ReasonCategory::with('subCategories')->get());
});

// Admin only
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/pki/bootstrap', [CertificateController::class, 'bootstrapCA']);
    Route::post('/certificates/revoke/{serial}', [CertificateController::class, 'revoke']);
});
```

---

## PKI dengan PHP Native OpenSSL

```php
// CAManager.php — Contoh fungsi utama (PHP OpenSSL native)

// Generate Root CA
$rootKey = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
$rootCsr = openssl_csr_new($dn, $rootKey, ['digest_alg' => 'sha256']);
$rootCert = openssl_csr_sign($rootCsr, null, $rootKey, 3650); // Self-signed, 10 tahun

// Issue User Certificate (dari public key yang dikirim extension)
$userCsr = openssl_csr_new($userDn, $userPublicKey);
$userCert = openssl_csr_sign($userCsr, $rootCert, $rootKey, 365); // 1 tahun

// Export PKCS#12 (.p12) untuk backup user
openssl_pkcs12_export($userCert, $p12Data, $userPrivateKey, $p12Password);
// → File .p12 bisa diimport ke Adobe Acrobat
```

---

## Alur Signing (100% Client-Side via GDrive API)

```
STEP 1 — Input di Extension Popup
  - URL Google Drive PDF asli
  - Reason (Kategori + Sub-Kategori + Custom input)
  - Posisi QR (drag & drop preview)
  - Master Password (decrypt private key RSA-2048 dari storage.local)

STEP 2 — Download PDF dari GDrive
  → Extension fetch via GDrive API v3
  → PDF asli masuk memori browser (ArrayBuffer)
  → Tidak melalui server TrustlessSign

STEP 3 — Stamping di Browser (pdf-lib + node-forge)
  a. SHA-256(PDF content)
  b. Decrypt RSA-2048 private key (AES-256-GCM + Master Password)
  c. RSA-2048 sign hash → Signature bytes
  d. Embed: signature + User cert X.509 + cert chain + signing reason
  e. Generate verify_token
  f. QR = https://[domain]/verify/{verify_token}
  g. Embed QR di posisi konfigurasi user

STEP 4 — Signing Success (User-Triggered Actions)
  ┌──────────────────────────────────────────────────┐
  │  ✅ Dokumen Berhasil Ditandatangani!             │
  │                                                  │
  │  File: surat-keputusan-001.pdf                   │
  │  Penandatangan: Budi Santoso                     │
  │  Waktu: 09 Juni 2026, 17:30 WIB                 │
  │  Reason: Mengesahkan: Surat Keputusan No. 001   │
  │                                                  │
  │  [⬇ Download PDF Signed] [☁ Simpan ke Drive]   │
  └──────────────────────────────────────────────────┘

  → [Download] → chrome.downloads.download() → folder Downloads
  → [Simpan ke Drive] → Upload via GDrive API
                      → Dapatkan URL GDrive signed PDF
                      → POST ke Laravel API /documents/register
                        { gdrive_url_signed, hash, token, cert_serial, ... }
                        ← Server HANYA terima URL + metadata, TIDAK ada konten
```

---

## Alur QR Verification (Zero-Trust Client-Side)

```
Penerima scan QR → buka /verify/{token}

Server Laravel → return HANYA metadata aman:
  {
    signer_name: "Budi Santoso",
    doc_hash_sha256: "abc123...",
    gdrive_url_signed: "https://drive.google.com/...",   ← URL, bukan isi file
    signed_at: "2026-06-09T17:30:00Z",
    reason: "Mengesahkan: Surat Keputusan No. 001",
    cert_status: "valid"
  }

JavaScript lokal di PublicLanding.tsx:
  1. Fetch PDF dari gdrive_url_signed → memori lokal
  2. Hitung SHA-256(PDF content)
  3. Bandingkan dengan doc_hash_sha256 dari server
  4. Tampilkan hasil:
     ✅ "DOKUMEN ASLI — Hash cocok, tidak dimanipulasi"
     ❌ "DOKUMEN DIMANIPULASI — Hash tidak cocok!"
     ⚠️  "SERTIFIKAT DICABUT — Dokumen tidak valid"
```

---

## Database Schema (Eloquent Models)

```sql
-- users
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(255),
    google_id       VARCHAR(255) UNIQUE,
    facebook_id     VARCHAR(255) UNIQUE,
    line_id         VARCHAR(255) UNIQUE,
    avatar          TEXT,
    gdrive_token    TEXT,              -- Encrypted GDrive OAuth token
    is_admin        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- certificates (public key only — NO private key)
CREATE TABLE certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    serial_number   VARCHAR(64) UNIQUE NOT NULL,
    subject_cn      VARCHAR(255) NOT NULL,
    cert_pem        TEXT NOT NULL,     -- X.509 PEM (public key only)
    issued_at       TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,
    revoke_reason   VARCHAR(255)
);

-- reason_categories
CREATE TABLE reason_categories (
    id          SERIAL PRIMARY KEY,
    name_en     VARCHAR(255) NOT NULL,
    name_id     VARCHAR(255) NOT NULL,
    sort_order  INTEGER DEFAULT 0
);

-- reason_sub_categories
CREATE TABLE reason_sub_categories (
    id              SERIAL PRIMARY KEY,
    category_id     INTEGER REFERENCES reason_categories(id),
    reason_text_en  VARCHAR(500),
    reason_text_id  VARCHAR(500),
    is_custom       BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0
);

-- documents (metadata only — NO document content)
CREATE TABLE documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID REFERENCES users(id),
    certificate_id      UUID REFERENCES certificates(id),
    reason_sub_cat_id   INTEGER REFERENCES reason_sub_categories(id),
    gdrive_url_signed   TEXT NOT NULL,
    original_filename   VARCHAR(500) NOT NULL,
    verify_token        VARCHAR(128) UNIQUE NOT NULL,
    doc_hash_sha256     VARCHAR(64) NOT NULL,
    qr_position         JSONB,           -- {page, x, y, size}
    reason_final        VARCHAR(1000),   -- Hasil string concatenation
    signed_at           TIMESTAMPTZ DEFAULT NOW(),
    notes               TEXT
);
```

---

## API Security (3 Layer)

```
bootstrap/app.php — Rate Limiting:
->withMiddleware(function (Middleware $middleware) {
    $middleware->throttleApi('60,1');  // 60 req/menit untuk public API
})

Endpoint Groups:
┌────────────────────────────────────────────────────┐
│ PUBLIC (Rate Limited 60/menit)                      │
│   GET /api/pki/root-cert                           │
│   GET /api/pki/crl                                 │
│   GET /api/verify/{token}                          │
│   GET /api/certificates/{serial}/download          │
├────────────────────────────────────────────────────┤
│ SANCTUM BEARER (Extension Auth)                     │
│   POST /api/certificates/issue                     │
│   GET  /api/certificates/me                        │
│   POST /api/documents/register                     │
│   GET  /api/documents                              │
│   GET  /api/reasons/categories                     │
├────────────────────────────────────────────────────┤
│ ADMIN (Sanctum + admin middleware)                  │
│   POST /api/pki/bootstrap                          │
│   POST /api/certificates/revoke/{serial}           │
└────────────────────────────────────────────────────┘
```

---

## Docker Setup

### `/home/vnot/docker/shared/docker-compose.yml` (Baru — belum ada)
```yaml
services:
  shared-postgres:
    image: postgres:15-alpine
    container_name: vnot-shared-postgres
    env_file: .env
    volumes:
      - shared_db_data:/var/lib/postgresql/data
    networks:
      - vnot_shared_net
    restart: unless-stopped

networks:
  vnot_shared_net:
    name: vnot_shared_net
    driver: bridge

volumes:
  shared_db_data:
```

### `trustlesssign/docker-compose.yml`
```yaml
services:
  app:
    build: .
    container_name: trustlesssign-app
    ports: ["8101:80"]           # ✅ Port 8101 verified free
    env_file: .env
    secrets:
      - root_ca_key
    networks:
      - vnot_shared_net
    restart: unless-stopped

secrets:
  root_ca_key:
    file: ./secrets/root_ca_key.pem    # gitignored

networks:
  vnot_shared_net:
    external: true                      # Join shared network
```

### `Dockerfile` (Laravel + Nginx + PHP-FPM)
```dockerfile
FROM php:8.2-fpm-alpine

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql pcntl bcmath

# OpenSSL already bundled in PHP Alpine ✅

# Install Nginx + Node.js (untuk build frontend assets)
RUN apk add --no-cache nginx nodejs npm

# Copy Laravel app
WORKDIR /var/www/html
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Build frontend assets
RUN npm ci && npm run build

EXPOSE 80
```

---

## Signing Reason — ISO 32000 + Adaptasi Indonesia

### UI Form

```
┌────────────────────────────────────────────────────┐
│  Alasan Penandatanganan                            │
│                                                    │
│  Kategori: [ Legalitas / Surat Resmi       ▼]     │
│                                                    │
│  Alasan:   [ I approve this document       ▼]     │
│            (atau ketik langsung / kosongkan)       │
│                                                    │
│  Detail:   [Surat Keputusan No. 001/2026     ]     │
│                                                    │
│  Preview:  "I approve this document:               │
│             Surat Keputusan No. 001/2026"          │
└────────────────────────────────────────────────────┘
```

### Logika Concatenation

```javascript
const val2 = (dropdown || "").trim();
const val3 = (customInput || "").trim();

let finalReason = val2 && val3 ? `${val2}: ${val3}`
                : val2         ? val2
                : val3         ? val3
                               : "Digital Verification";

pdfSignatureOptions.reason = finalReason;
```

---

## Extension ID Locking — Langkah & SDP Reminder

```
1. Buat manifest.json minimal di chrome-extension/
2. chrome://extensions/ → Developer Mode → Load unpacked
3. Catat Extension ID (32 char)
4. Pack extension → dapatkan key.pem (GITIGNORED)
5. Paste isi key.pem ke "key" di manifest.json
6. Reload → ID permanen
7. Daftarkan chrome-extension://[ID] di Google Cloud Console

⚠️ POST-IMPLEMENTATION REMINDER:
Catat di docs/SDP.md setelah langkah ini selesai:
  - Extension ID yang terkunci
  - URL di Google Cloud Console
  - Tanggal eksekusi
```

---

## Verification Checklist (Final)

**Infrastructure:**
- [ ] `/home/vnot/docker/shared/` dibuat + `shared-postgres` running
- [ ] Database `trustlesssign` + semua tabel + seed reason categories

**PKI (PHP OpenSSL):**
- [ ] Bootstrap Root CA RSA-2048 via `CAManager.php`
- [ ] `root_ca.crt` & `root_ca.key` tergenerate di Docker Secret path
- [ ] Download `root-cert` dari public API endpoint ✓
- [ ] Download `root-cert` dari popup extension ✓
- [ ] Install Root CA di Adobe → ✅ centang hijau ✓

**Extension Setup:**
- [ ] Extension ID dikunci via `key.pem` → `manifest.json "key"` ✓
- [ ] ID didaftarkan di Google Cloud Console ✓
- [ ] Dicatat di `docs/SDP.md` ✓

**Auth & OAuth:**
- [ ] Login email/password ✓
- [ ] Google OAuth (Socialite) di dashboard ✓
- [ ] Google OAuth (chrome.identity) di extension ✓
- [ ] GDrive connect di extension onboarding ✓
- [ ] GDrive connect di `/dashboard/connect-gdrive` ✓

**Keypair & Certificate:**
- [ ] Extension generate RSA-2048 keypair (Web Crypto API) ✓
- [ ] Private key → `chrome.storage.local` (AES-256 + Master Password) ✓
- [ ] Auto-download backup `.p12` ke Downloads user ✓
- [ ] Issue X.509 cert (PHP OpenSSL, server-side) ✓
- [ ] Modal peringatan Master Password muncul + wajib dicentang ✓

**Signing Flow:**
- [ ] Input reason via Kategori + Sub-Kategori + Custom ✓
- [ ] Preview concatenation sebelum sign ✓
- [ ] QR drag-and-drop di PDF preview ✓
- [ ] Sign PDF lokal (RSA-2048, pdf-lib + node-forge) ✓
- [ ] Signing Success notification muncul ✓
- [ ] User klik Download → `chrome.downloads.download()` ✓
- [ ] User klik Simpan ke Drive → GDrive API upload ✓
- [ ] Laravel API terima URL signed + metadata (tanpa konten) ✓

**Verification:**
- [ ] Scan QR → `/verify/{token}` → metadata dari server ✓
- [ ] Client-side hash comparison di `PublicLanding.tsx` ✓
- [ ] Extension 2-layer verification (integrity + identity) ✓
- [ ] Import `.p12` ke Adobe → sign offline ✓
- [ ] **Tamper test:** modifikasi PDF → ❌ hash mismatch ✓
- [ ] Revoke cert → verify → status `REVOKED` ✓
