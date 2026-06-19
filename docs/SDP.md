# Software Development Plan (SDP)
## Project: TrustlessSign
## Current State / Log Progress

- **Tanggal/Waktu:** 2026-06-18T20:00:00Z
- **Tugas yang diselesaikan:** Implement Seamless SSO (Web-Only Auth) untuk Ekstensi
- **File yang diubah/dibuat:** `popup.js`, `popup.html`, `manifest.json` (Chrome & Safari), `Welcome.jsx`, `SocialiteController.php`, `web.php`.
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Auth flow ekstensi telah dimigrasikan dari `chrome.identity` menjadi berbasis cookie untuk SSO yang seamless dengan Web Dashboard, menghindari email persetujuan Google ganda. Ekstensi menggunakan `chrome.cookies.get` untuk memonitor token `tsign_api_token` dan `tsign_gdrive_token` yang diisukan oleh `SocialiteController` (Sanctum) dengan attribute `SameSite=None` dan `Secure=true`. Web Dashboard hanya memunculkan "Login Via TrustlessSign" tanpa branding Google di ekstensi. Pengecekan auth telah disinkronkan.
- **Tanggal/Waktu:** 2026-06-17T09:05:00Z
- **Tugas yang diselesaikan:** Refactoring UI navigasi halaman PDF di Browser Extension: Mengganti input "Go to" terpisah dengan inline pagination di antara label "Page X of Y", dan menjawab status enkripsi PDF (`ignoreEncryption`).
- **File yang diubah/dibuat:** `chrome-extension/popup/popup.html`, `chrome-extension/popup/popup.js`, `safari-extension/Resources/popup.html`, `safari-extension/Resources/popup.js`, `chrome-extension/package.json`, `safari-extension/Resources/manifest.json`.
- **Status saat ini:** Selesai. Melakukan version bump untuk ekstensi dan web menjadi 1.4.14, membuat tag, dan memicu CI/CD.
- **Catatan untuk AI selanjutnya (Handoff Note):** Input `Go to` di popup kini telah disatukan secara inline dengan teks `Page`. Event listener `change` dan `Enter` telah diaplikasikan. Mengenai error enkripsi, opsi `{ ignoreEncryption: true }` sudah ada di `signer.js` dari sesi sebelumnya.

- **Tanggal/Waktu:** 2026-06-17T08:55:00Z
- **Tugas yang diselesaikan:** Fixing Error "Input document to PDFDocument.load is encrypted"
- **File yang diubah/dibuat:** `chrome-extension/signing/signer.js`, `safari-extension/Resources/signing/signer.js`, `chrome-extension/package.json`, `chrome-extension/manifest.json`, `safari-extension/Resources/manifest.json`
- **Status saat ini:** Selesai (Versi Ekstensi naik ke `ext-v1.4.13`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menambahkan opsi `{ ignoreEncryption: true }` pada `PDFLib.PDFDocument.load` di file `signer.js` untuk mengabaikan error apabila user mencoba me-load PDF yang memiliki properti enkripsi/password proteksi (sering terjadi pada PDF _readonly_). Melakukan version bump untuk ekstensi ke 1.4.13, membuat tag, dan memicu CI/CD.


- **Tanggal/Waktu:** 2026-06-17T08:38:00Z
- **Tugas yang diselesaikan:** Fixing Error 502 Bad Gateway pada Web UI (Cloudflare Tunnel)
- **File yang diubah/dibuat:** `/home/vnot/docker/shared/docker-compose.yml`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Menganalisis penyebab error 502 pada domain `tsign.vnot.my.id`. Melalui log kontainer `cloudflared-tunnel`, diketahui bahwa Cloudflare mencoba menghubungi *origin service* di `127.0.0.1:8101`, sedangkan `shared-nginx` sebelumnya terekspos pada port `8081`. Port di `docker-compose.yml` (shared network) telah diperbaiki menjadi `8101:80` dan kontainer di-*restart*. Akses web sekarang sudah normal (HTTP 200 OK).

- **Tanggal/Waktu:** 2026-06-16T14:09:00Z
- **Tugas yang diselesaikan:** Memicu CI/CD Web dan Ekstensi melalui git tag push.
- **File yang diubah/dibuat:** `web/package.json`, `chrome-extension/package.json`, `chrome-extension/manifest.json`, `safari-extension/Resources/manifest.json`
- **Status saat ini:** Selesai (Versi Web naik ke `web-v1.3.21`, Ekstensi ke `ext-v1.4.12`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Version bump telah dilakukan secara manual pada environment Web (1.3.21) dan Ekstensi (1.4.12) sesuai prinsip SSOT monorepo. Tag `web-v1.3.21` dan `ext-v1.4.12` telah dibuat dan didorong (pushed) ke remote `origin` bersamaan dengan commit yang menyertakan perubahan UI pada `SignDocument.jsx` dan file terkait image signature/pagination lainnya, yang mana akan otomatis memicu pipeline Github Actions untuk deployment sinkronisasi ke server dan kompresi `.crx` ke perangkat lokal Macbook/Windows.

- **Tanggal/Waktu:** 2026-06-16T09:03:00Z
- **Tugas yang diselesaikan:** Mengubah Background QR Code menjadi Transparan
- **File yang diubah/dibuat:** `chrome-extension/signing/barcode-generator.js`, `safari-extension/Resources/signing/barcode-generator.js`, `web/resources/js/Utils/barcode-generator.js`
- **Status saat ini:** Selesai (Versi Ekstensi naik ke `ext-v1.4.11`, Web `web-v1.3.20`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Sesuai catatan pengguna, *backgroundOptions.color* pada fungsi `generateModernTSignQR` telah diubah dari `#FFFFFF` menjadi `transparent`. Hal ini memastikan bahwa baik kode QR maupun bingkai *Image Signature* (yang sebelumnya sudah transparan via `ctx.clearRect`) dapat menyatu tanpa *block* putih solid saat disematkan di atas PDF, menjaga estetika dokumen.

- **Tanggal/Waktu:** 2026-06-16T07:08:00Z
- **Tugas yang diselesaikan:** Memperbaiki teks Marginal Page Stamp yang terpotong (Missing Text)
- **File yang diubah/dibuat:** `chrome-extension/signing/barcode-generator.js`, `safari-extension/Resources/signing/barcode-generator.js`, `web/resources/js/Utils/barcode-generator.js`
- **Status saat ini:** Selesai (Versi Ekstensi naik ke `ext-v1.4.10`, Web `web-v1.3.19`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Teks pada *Marginal Page Stamp* ("tSign ID: ...") sebelumnya tidak tercetak secara penuh (terpotong atau hilang dari kanvas) akibat lebar *barcode* secara otomatis melebar (skala default `JsBarcode`), yang mana menabrak batas maksimal *canvas.width = 800*. Solusinya: menetapkan `width: 1.5` pada konfigurasi *JsBarcode* dan mengganti *font* menjadi `12px monospace` tebal agar cukup muat di dalam kanvas 800px dan memiliki tingkat keterbacaan (*legibility*) tinggi saat di-*scale down* pada *ribbon width* 400px.

- **Tanggal/Waktu:** 2026-06-16T05:25:00Z
- **Tugas yang diselesaikan:** Memperbaiki Akurasi Ukuran & Skala Koordinat Drag and Drop pada Ekstensi
- **File yang diubah/dibuat:** `chrome-extension/popup/popup.js`, `safari-extension/Resources/popup.js`
- **Status saat ini:** Selesai (Versi Ekstensi naik ke `ext-v1.4.9`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Koordinat sumbu Y (`relativeY`) pada ekstensi sebelumnya dikalkulasi menggunakan estimasi kasar tinggi `800px` yang merusak rasio aspek PDF asli. Ini telah diperbaiki dengan menghitung `displayScale = 600 / canvasRect.width` dan mengalikannya pada koordinat `qrX` maupun `qrY`. Selain itu, ukuran payload (`size`) dan ukuran *visual container drag box* (`qrDragBox`) sekarang berubah dinamis bergantung pada *signatureType* (QR = 72, Image = 115) untuk menyamakan proporsi dan akurasi dengan Web Dashboard.

- **Tanggal/Waktu:** 2026-06-16T05:16:00Z
- **Tugas yang diselesaikan:** Fix SyntaxError 'Unexpected token export' di barcode-generator.js Ekstensi
- **File yang diubah/dibuat:** `chrome-extension/signing/barcode-generator.js`, `safari-extension/Resources/signing/barcode-generator.js`
- **Status saat ini:** Selesai (Versi Ekstensi naik ke `ext-v1.4.8` dan Web ke `web-v1.3.18`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Memperbaiki bug di mana `barcode-generator.js` yang diduplikasi dari web secara tidak sengaja mempertahankan *keyword* `export async function...`. Karena ekstensi menggunakan *script* ini secara klasik di dalam *popup.html* tanpa tipe *module*, ini menyebabkan *Uncaught SyntaxError*. *Keyword* `export` telah dihapus sehingga semua fungsi diregistrasi langsung pada tingkat global secara implisit.

- **Tanggal/Waktu:** 2026-06-16 10:40 UTC
- **Tugas yang diselesaikan:** Implementasi PDF Pagination & Specific Page Selection (Sprint 5)
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/SignDocument.jsx`
  - `chrome-extension/popup/popup.html`
  - `chrome-extension/popup/popup.js`
  - `safari-extension/Resources/popup.html`
  - `safari-extension/Resources/popup.js`
  - `docs/new/pdf-pagination-implementation_plan.md` (NEW)
  - `docs/new/pdf-pagination-task.md` (NEW)
- **Status saat ini:** Selesai (Menunggu QA / Verifikasi Manual).
- **Catatan untuk AI selanjutnya:** Fitur navigasi halaman (Prev, Next, Go To) telah di-implementasikan dan terhubung dengan metadata payload `qrPosition.page` agar tanda tangan disisipkan tepat di halaman yang dipilih pengguna. Tolong lanjutkan ke CI/CD build untuk extension jika QA manual sudah diverifikasi pengguna.

- **Tanggal/Waktu:** 2026-06-16 04:30 UTC:00Z
- **Tugas yang diselesaikan:** Migrasi (Duplikasi) Visual Image Signature & Modern QR Code ke Extension
- **File yang diubah/dibuat:** `chrome-extension/assets/qr-code-styling.js`, `chrome-extension/assets/logo-tSign.svg`, `chrome-extension/popup/popup.html`, `chrome-extension/popup/popup.js`, `chrome-extension/signing/barcode-generator.js`, beserta file-file paralel di `safari-extension`. `qrious.min.js` dihapus.
- **Status saat ini:** Selesai (Menunggu pengujian lokal)
- **Catatan untuk AI selanjutnya (Handoff Note):** Logika `barcode-generator.js` dari Web Dashboard telah diduplikasi sepenuhnya ke Ekstensi. Ekstensi kini menggunakan pustaka `qr-code-styling` untuk QR Code mandiri dengan logo (`logo-tSign.svg`). Logika *Marginal Page Stamp* juga telah dimasukkan ke dalam `popup.js`, di mana ekstensi kini akan mencetak barcode melintang -90 derajat pada margin halaman asalkan jumlah halamannya > 1. Jika pengguna menandatangani dokumen 1 halaman, ekstensi akan mem-bypass (mengosongkan array) stamp tersebut. Eksekusi ini sudah selesai dan menunggu *build/compile* `.crx` dan tes akhir.

- **Tanggal/Waktu:** 2026-06-16T03:52:00Z
- **Tugas yang diselesaikan:** Fix Zero-Trust Auth Error in barcode-generator.js
- **File yang diubah/dibuat:** `chrome-extension/signing/barcode-generator.js`, `safari-extension/Resources/signing/barcode-generator.js`, `chrome-extension/package.json`, `chrome-extension/manifest.json`, `safari-extension/Resources/manifest.json`
- **Status saat ini:** Selesai (Version `ext-v1.4.6`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Memperbaiki bug di mana fungsi `chrome.identity.getAuthToken` memblokir pengguna (melemparkan error "Unauthorized to render signature frame") ketika pengguna tidak memiliki sesi Google Chrome aktif. `throw new Error` diganti menjadi `console.warn` sehingga ekstensi tidak gagal dan tetap dapat menandatangani dokumen menggunakan *backend token local session* (fallback mode). Tag versi diperbarui ke `ext-v1.4.6`.

- **Tanggal/Waktu:** 2026-06-16T02:37:00Z
- **Tugas yang diselesaikan:** Bump extension version to 1.4.5 & Trigger CI/CD (Sync Macbook)
- **File yang diubah/dibuat:** `chrome-extension/package.json`, `chrome-extension/manifest.json`, `safari-extension/Resources/manifest.json`
- **Status saat ini:** Selesai (Version `ext-v1.4.5`)
- **Catatan untuk AI selanjutnya (Handoff Note):** User meminta agar sinkronisasi perangkat Macbook dijalankan via CI/CD. Telah dilakukan version bump secara konsisten di package.json dan manifest.json ke versi 1.4.5. Git tag `ext-v1.4.5` telah dibuat dan didorong ke remote untuk memicu `deploy_extension` workflow yang mengeksekusi Tailscale SSH SCP ke perangkat Macbook Air target.

- **2026-06-15 20:00**:
  - Implementasi Marginal Page Stamp (Page Swapping Protection)
  - Web UI mengirimkan array base64 stamp image (`pageStamps`) ke ekstensi, dirotasi 90 CCW di ekstensi untuk semua halaman.
- **2026-06-09 18:22**: 
  - Shared Postgres network `vnot_shared_net` and container created.
  - `trustlesssign` database created.
  - Laravel 11 project scaffolded successfully (using PHP 8.2 compatible image).
  - Backend dependencies installed (Inertia, Ziggy, Sanctum, Socialite).
  - Frontend NPM dependencies installed (React, Inertia React, Tailwind, react-pdf, react-draggable).
  - Chrome extension directory skeleton created (`chrome-extension/`).
  - `.env` configured for postgres and `docker-compose.yml` configured for backend.
  - Boilerplate models, migrations, controllers, seeder, and PKI service directories generated.
  - Laravel updated to run on PHP 8.4-fpm-alpine.
  - Migrations updated to follow architecture constraints and successfully executed.
  - ReasonCategorySeeder implemented and database seeded successfully.
  - PKI Service (`CAManager.php`) implemented using Native PHP OpenSSL (RSA-2048).
  - Root CA bootstrapping and User Certificate issuing from CSR tested successfully.
  - **2026-06-09 18:40**:
    - Resolved container storage permission errors (`Failed to open stream: Permission denied`) by adjusting ownership/permissions of `storage` and `bootstrap/cache` on the host side to `777`.
    - Implemented `app/Services/PKI/CertValidator.php` to parse and validate X.509 certificate chains against the Root CA and look up DB revocation.
    - Implemented REST Controllers: `CertificateController.php`, `DocumentController.php`, `VerificationController.php`, and `AuthController.php` (web session and Sanctum bearer token authentication).
    - Registered and validated all API endpoints in `routes/api.php`, including the custom role-based admin authorization check.
    - Updated the published Laravel Sanctum migration file to use `uuidMorphs` to prevent column type mismatch on UUID primary keys.
    - Configured the global `api` rate limiter (60 req/min) in `AppServiceProvider.php`.
    - Developed a comprehensive integration test `tests/Feature/TrustlessSignApiTest.php` to verify the entire API lifecycle (100% test pass with 47 assertions).
    - **NEXT TASK**: Set up the full-stack React and Inertia.js views (auth screens, user dashboard, document signer config, and the public verification landing page) and integrate Tailwind CSS.
- **2026-06-09 18:58**:
  - Migrated Docker container to `php:8.5-fpm-alpine`.
  - Upgraded Laravel framework to version `^13.0` and completed composer dependency resolution without conflicts.
  - Verified API endpoint accessibility.
  - **NEXT TASK**: Implement UI features (Draggable QR Code layout), Chrome Extension Key storage using `chrome.storage.local`, Google/Facebook Social Login, and Multi-language support (id, en, th) without hardcoded text. Handle Document status "Belum Tersimpan" logic.
  - **2026-06-09 19:05**: 
    - Database migrations aligned, verifying schema includes `google_id`, `facebook_id`, `avatar`, and document `status`, `drive_url`.
    - Integrated `chrome.storage.local` within Chrome extension `popup.js` per Opsi 1 constraints.
    - Implemented UI constraints using React Inertia:
      - Multi-language dictionary files (`en.json`, `id.json`, `th.json`) parsed via `HandleInertiaRequests.php` middleware.
      - `react-draggable` applied to QR code configuration component.
      - `VerificationController.php` updated to check for `is_saved_to_drive` (returns Dokumen Tidak Valid / Belum Tersimpan).
    - Resolved frontend Vite builds successfully with Tailwind configurations mapped for Laravel 13.
    - **STATUS**: Complete. Ready for deployment and live testing.
  - **2026-06-09 19:21**:
    - Fixed "Get Started" and "Login" loops on the landing page where clicking them previously just reloaded `/login` (which rendered the home page again).
    - Passed `autoOpenLogin` prop from Laravel web router when visiting `/login`.
    - Integrated a premium, fully-accessible modal dialog for oauth provider selection (Google, Facebook, Line) following the Bio-Digital Minimalism style.
    - Updated translation dictionary files (`en.json`, `id.json`, `th.json`) to map all modal labels and eliminate hardcoded UI text.
    - Added reactive state to automatically open the modal if the user targets `/login` or clicks header/hero buttons, and direct to dashboard when already authenticated.
    - **STATUS**: Selesai.
  - **2026-06-09 22:01**:
    - Added `LanguageSwitcher` and `ThemeToggle` elements to the header of the Sign Document (`/sign`) page matching the Dashboard interface.
    - Resolved the QR code draggable interference bug by applying `pointer-events-none` and `user-select-none` to the underlaying react-pdf text and annotation layer classes in CSS.
    - Updated the signature button text and alert trigger messaging to "Sign & Seal" across all language translation files (`en.json`, `id.json`, `th.json`).
    - Fixed stacking context issue of the header element by adding `relative z-50` class, ensuring language switcher dropdown is no longer covered by main content.
    - Compiled assets with Vite production build successfully.
    - **STATUS**: Selesai.
- **2026-06-09 23:15**:
  - Aligned progress overlay text and icons in `SignDocument.jsx` and `popup.html` / `popup.js` to match the exact format: `✔️`, `⏳`, and `🔄` (spinning emoji), with Google Drive references and upload progress percentage indicators.
  - Removed standard strikethrough (`line-through`) visual format for completed steps in the status overlay checklist.
  - Aligned certificate warning modal buttons on `Dashboard.jsx` to follow the parenthesized naming conventions: `( BATAL )` and `(( YA, REPLACE SERTIFIKAT ))` / `(( GENERATE SERTIFIKAT ))`.
  - Ran PHPUnit feature tests to verify API endpoints, registration, and revocation (all 47 assertions passing successfully).
  - Re-compiled frontend assets via Vite production build cleanly.
  - **STATUS**: Selesai.
  - **Tanggal/Waktu:** 2026-06-11T07:05:00Z
- **Tugas yang diselesaikan:** Implement Google Drive Token Auto-Refresh & Fallback UX
- **File yang diubah/dibuat:** `create_users_table.php`, `User.php`, `SocialiteController.php`, `api.php`, `service-worker.js`, `popup.js`, `SignDocument.jsx`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Migrasi penambahan kolom `gdrive_refresh_token` telah dieksekusi. Fitur ini menambahkan opsi untuk `fallback` jika refresh gagal (Local Save). Pengaturan Google Console diserahkan pada User.

- **2026-06-10 07:30**:
  - Configured and registered the self-hosted GitHub Actions runner on the VPS for the repository.
  - Updated `.github/workflows/deploy.yml` to run `./vendor/bin/phpunit` instead of `php artisan test` because the `test` artisan command is not defined in this Laravel setup.
  - Successfully pushed the fixes and triggered the automated CI/CD pipeline.
  - **STATUS**: Selesai (CI/CD active and verified).
  - **2026-06-10 07:38**:
    - Resolved Content Security Policy (CSP) violations in Manifest V3 chrome and safari extensions by downloading and bundling `pdf.min.js` and `pdf.worker.min.js` locally in `assets/`.
    - Fixed `ReferenceError: window is not defined` in background service worker context by mocking `self.window = self` before importing minified libraries.
    - Successfully pushed extension updates to GitHub.
    - **STATUS**: Selesai.
  - **2026-06-10 07:45**:
    - Added the base64 public key to `chrome-extension/manifest.json` as the `"key"` property to ensure a persistent extension ID (`jdfdjlkcemajaabnkllbacmajdalooib`) during development.
    - Noted requirement to delete this `"key"` property prior to publishing on the Chrome Web Store.
    - **STATUS**: Selesai.
  - **2026-06-10 08:00**:
    - Cleaned up bracketed buttons on Web Dashboard modal (e.g. `(CANCEL)` -> `CANCEL`, `(( GENERATE CERTIFICATE ))` -> `GENERATE CERTIFICATE`).
    - Added `/api/user` endpoint to backend to allow extension to fetch real user details.
    - Modified extension popup profile widget to render authenticated user's actual name, email, and Google profile picture instead of generic placeholders.
    - Integrated multi-language select menu (EN, ID, TH) and manual theme switcher (Light / Dark) into the header of Chrome & Safari extensions.
    - Re-built frontend production assets cleanly.
    - **STATUS**: Selesai.
  - **2026-06-10 08:17**:
    - Resolved CORS redirects on unauthorized extension API calls by adding `'Accept': 'application/json'` to all backend fetch requests in `popup.js` (Chrome & Safari).
    - Fixed CSP inline script violation in content scripts by replacing inline script injection with HTML dataset attribute `document.documentElement.dataset.trustlessSignInstalled`.
    - Aligned React components `Dashboard.jsx` and `SignDocument.jsx` to verify extension presence via both the window object and the HTML dataset attribute.
    - Integrated `content.js` bridge inside `safari-extension` and configured `content_scripts` in Safari `manifest.json`.
    - Compiled all production assets successfully with Vite inside the Docker container.
    - **STATUS**: Selesai. Ready for deployment review.
    
- **Tanggal/Waktu:** 2026-06-10T08:33Z
- **Tugas yang diselesaikan:** Fix blank "Reason Category" & "Signature Reason" dropdowns
- **File yang diubah/dibuat:** `web/database/seeders/DatabaseSeeder.php`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya:** Reason dropdown di Chrome Extension tidak memuat data karena tabel `reason_categories` di database masih kosong. Saya sudah memasukkan `ReasonCategorySeeder` ke dalam `DatabaseSeeder.php` dan menjalankan seedernya ke database secara manual. Status 404 pada `/api/certificates/me` adalah normal jika user belum pernah melakukan generate Secure Key (belum memiliki sertifikat aktif).

- **Tanggal/Waktu:** 2026-06-10T12:20:00Z
- **Tugas yang diselesaikan:** Fix database wiping issue caused by test environment using main database connection and RefreshDatabase
- **File yang diubah/dibuat:** [phpunit.xml](file:///home/vnot/extra_disk/docker-temp/trustlesssign/web/phpunit.xml)
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Isolated testing environment to SQLite in-memory, preventing test suite run via CI/CD (which triggers RefreshDatabase) from wiping the main PostgreSQL database. Re-seeded Reason Categories using `ReasonCategorySeeder` so dropdowns are fully loaded again.

- **Tanggal/Waktu:** 2026-06-10T12:55:00Z
- **Tugas yang diselesaikan:** Fix ReferenceError on subCategories and Auth check error loop in Chrome/Safari extension.
- **File yang diubah/dibuat:** [popup.js](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/popup/popup.js), [popup.js](file:///home/vnot/extra_disk/docker-temp/trustlesssign/safari-extension/Resources/popup.js), [package.json](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/package.json), [manifest.json](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/manifest.json)
- **Status saat ini:** Selesai (Bumped version to 1.0.2)
- **Catatan untuk AI selanjutnya (Handoff Note):** Fixed ReferenceError where subCategories was used without declaration in popup.js during document signing. Handled 401 Unauthorized by removing expired/invalid tokens from chrome.storage.local. Bumped version to 1.0.2 in both package.json and manifest.json. Rebuilt trustlesssign-v1.0.2.crx.

- **Tanggal/Waktu:** 2026-06-10T14:25:00Z
- **Tugas yang diselesaikan:** Fix IDE Git tracking issue by ignoring node_modules globally and adding extension build artifacts.
- **File yang diubah/dibuat:** [.gitignore](file:///home/vnot/extra_disk/docker-temp/trustlesssign/.gitignore)
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Ignored node_modules recursively using `node_modules/` and `**/node_modules/` in root `.gitignore`. Also ignored compiled `service-worker.bundle.js` for both Chrome and Safari extensions. This reduced IDE untracked files count from 3000++ to 1.

- **Tanggal/Waktu:** 2026-06-11T04:25:00Z
- **Tugas yang diselesaikan:** Fix `uploadInterval` error & add Certificate UI Validation
- **File yang diubah/dibuat:** `CertificateController.php`, `popup.js` (Chrome & Safari), `SignDocument.jsx`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Mencegah backend melempar 404 (Console error) saat user belum punya sertifikat dengan return `200 OK` (dengan flag `has_certificate`). Mengatasi bug `uploadInterval is not defined` di Chrome/Safari Extension akibat scope variable di blok catch. Menambahkan validasi keberadaan sertifikat pada Extension UI dan Web UI sehingga tombol "Sign & Seal" otomatis didisable dan memunculkan peringatan apabila user belum men-generate Secure Key.

- **Tanggal/Waktu:** 2026-06-11T04:41:00Z
- **Tugas yang diselesaikan:** Fix ArrayBuffer detachment & Suppress UI errors for debugging
- **File yang diubah/dibuat:** `popup.js` (Chrome & Safari), `package.json`, `manifest.json`
- **Status saat ini:** Selesai (Bumped version to 1.0.4)
- **Catatan untuk AI selanjutnya (Handoff Note):** Di dalam `popup.js`, pembacaan file PDF (`pdfjsLib.getDocument({ data: pdfUint8 })`) mendeteksi `ArrayBuffer` dan mentransfernya ke Web Worker PDF.js, menyebabkan ArrayBuffer asli ter-detach (size 0) sehingga gagal saat mencoba diconvert ke Base64 via `arrayBufferToBase64(currentFileBytes)`. Memperbaikinya dengan mem-passing `new Uint8Array(currentFileBytes.slice(0))` agar PDF.js mendapatkan salinan buffer (copy) dan bukan referensi aslinya. Sesuai instruksi pengguna, `showSignError()` di dalam blok `catch` ketika proses *signing* dihapus dan diganti dengan `console.error()` agar tidak membingungkan pengguna jika terjadi *runtime error* yang tidak terduga.

- **Tanggal/Waktu:** 2026-06-11T04:45:00Z
- **Tugas yang diselesaikan:** Fix missing QRious library in popup
- **File yang diubah/dibuat:** `popup.html` (Chrome & Safari), `assets/qrious.min.js`, `package.json`, `manifest.json`
- **Status saat ini:** Selesai (Bumped version to 1.0.5)
- **Catatan untuk AI selanjutnya (Handoff Note):** Library QRious sebelumnya tidak dilampirkan dalam file `popup.html` meski dipanggil di dalam `popup.js` sehingga menyebabkan *ReferenceError: QRious is not defined*. Telah diunduh library `qrious.min.js` ke dalam folder `assets/` dan ditambahkan ke dalam tag script pada `popup.html`.

- **Tanggal/Waktu:** 2026-06-11T04:55:00Z
- **Tugas yang diselesaikan:** Organize GDrive uploads into specific subfolders & verify filename integrity
- **File yang diubah/dibuat:** `gdrive.js` (Chrome & Safari), `package.json`, `manifest.json`
- **Status saat ini:** Selesai (Bumped version to 1.0.6)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menjawab kekhawatiran user terkait perbedaan nama file unduhan (lokal) dan unggahan (GDrive), nama file tidak memengaruhi validitas *cryptographic signature* (karena yang di-hash adalah konten byte PDF-nya). File tetap sah secara kriptografi terlepas dari apa namanya. Selain itu, menambahkan mekanisme otomatis di dalam `gdrive.js` untuk membuat hierarki folder dinamis `TrustLessSign/{Bulan}.{Tahun}` di Google Drive pengguna menggunakan `getOrCreateFolder()` API agar dokumen lebih rapi.

- **Tanggal/Waktu:** 2026-06-11T05:05:00Z
- **Tugas yang diselesaikan:** Fix "No Certificate Found" error on Web App `/sign` page
- **File yang diubah/dibuat:** `web/routes/web.php`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Halaman UI React (SignDocument.jsx) melakukan _fetch_ ke endpoint `/certificates/me` secara langsung tanpa _Bearer token_, namun rute tersebut belum didefinisikan di dalam `web.php` (hanya ada di `api.php`). Hal ini menyebabkan _error 404_ sehingga status sertifikat di-set `false`. Telah ditambahkan _route_ `/certificates/me` yang membaca sertifikat aktif pengguna berdasarkan sesi web saat itu juga.

- **Tanggal/Waktu:** 2026-06-11T05:15:00Z
- **Tugas yang diselesaikan:** Fix Google Drive "View on Drive" link format
- **File yang diubah/dibuat:** `gdrive.js` (Chrome & Safari), `package.json`, `manifest.json`
- **Status saat ini:** Selesai (Bumped version to 1.0.7)
- **Catatan untuk AI selanjutnya (Handoff Note):** Tautan Google Drive pada UI hasil penandatanganan mengarah ke tautan unduhan langsung (`uc?export=download&id=...`). Pengguna menginginkan tautan tersebut berfungsi sebagai "View" (pratinjau) (`file/d/.../view`). Kode *return URL* pada file `gdrive.js` telah diganti agar sesuai dengan format tautan peninjauan GDrive.

- **Tanggal/Waktu:** 2026-06-11T05:35:00Z
- **Tugas yang diselesaikan:** Set standard PDF Metadata (Title, Author, Keywords) automatically
- **File yang diubah/dibuat:** `signer.js` & `service-worker.js` (Chrome & Safari), `SignDocument.jsx`, `manifest.json`
- **Status saat ini:** Selesai (Bumped version to 1.0.8)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menambahkan injeksi Metadata Standar PDF via *pdf-lib* (`setTitle`, `setAuthor`, `setKeywords`, `setCreator`, `setProducer`) menggunakan data nama file dan nama pengguna (Author) yang diumpan dari Web UI (`user.name`). Metadata `BaseUrl` tidak diinjeksikan karena tautan GDrive belum ada pada saat proses stempel/hash kriptografi PDF dilakukan. JSON parameter *verify_token* tetap dipertahankan utuh pada kolom `Subject` untuk kebutuhan verifikasi masa depan.

- **Tanggal/Waktu:** 2026-06-11T06:15:00Z
- **Tugas yang diselesaikan:** Add Version Footer to Dashboard & Update Monorepo Versioning Rules
- **File yang diubah/dibuat:** `Dashboard.jsx`, `HandleInertiaRequests.php`, `.agents/rules/dev-trustlesssign.md`
- **Status saat ini:** Selesai (Web Version: 1.0.1)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menambahkan *footer* penanda versi di halaman Dashboard (mengambil variabel dinamis `version_name` langsung dari file `web/package.json` menggunakan backend Laravel/Inertia). Selain itu, merevisi aturan internal `dev-trustlesssign.md` untuk menerapkan standar *Monorepo Versioning* di mana Web (Laravel) dan Ekstensi Browser diperlakukan sebagai entitas versi yang terpisah (Decoupled).

- **Tanggal/Waktu:** 2026-06-11T06:25:00Z
- **Tugas yang diselesaikan:** Update Extension Footer Design to Professional Format
- **File yang diubah/dibuat:** `popup.html` (Chrome & Safari), `package.json`, `manifest.json`
- **Status saat ini:** Selesai (Extension Version: 1.0.9)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menyeragamkan bahasa dan desain Footer Ekstensi (*popup.html*) agar memiliki gaya profesional yang setara dengan Footer Dashboard web. Teks kasual diganti menjadi `"TrustlessSign Extension - Version [X.X.X]"`.

- **Tanggal/Waktu:** 2026-06-11T06:30:00Z
- **Tugas yang diselesaikan:** Decouple CI/CD Pipeline (Monorepo Workflow)
- **File yang diubah/dibuat:** `.github/workflows/deploy.yml`, `.agents/rules/dev-trustlesssign.md`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengubah GitHub Actions agar mendukung Monorepo *Versioning*. Trigger sekarang berdasarkan `tags: web-v*` atau `ext-v*`. Proses `deploy_web` dan `deploy_extension` berjalan terpisah dengan pengecekan kondisional (`startsWith`) untuk menghindari eksekusi serentak yang tumpang tindih. Ekstensi tidak lagi me-reset *cache* Laravel, dan Web tidak lagi memicu kompresi `.crx`. Dokumen aturan pengembangan (`dev-trustlesssign.md`) juga telah diperbarui dengan panduan *Workflow Deployment CI/CD Monorepo* ini.

- **Tanggal/Waktu:** 2026-06-11T06:35:00Z
- **Tugas yang diselesaikan:** Tweak Extension Footer to include Jazakumullah text & version_name
- **File yang diubah/dibuat:** `popup.html`, `popup.js` (Chrome), `package.json`, `manifest.json`
- **Status saat ini:** Selesai (Extension Version: 1.0.10)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menambahkan kembali frasa `Jazakumullah Khairan 🙏` ke *footer* ekstensi sesuai permintaan pengguna, sekaligus memperbarui pemanggilan versi agar mengambil `version_name` (mis. "1.0.10-dev") alih-alih `version` numerik mentah di `popup.js`.

- **Tanggal/Waktu:** 2026-06-11T06:45:00Z
- **Tugas yang diselesaikan:** Format PDF Subject Metadata as Human-Readable Text
- **File yang diubah/dibuat:** `signer.js` (Chrome & Safari), `package.json`, `manifest.json`
- **Status saat ini:** Selesai (Extension Version: 1.0.11)
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengubah *injection* properti PDF `Subject` dari *string* JSON mentah menjadi teks yang bisa dibaca manusia. Format prioritas: Menampilkan `reason` jika ada, dan menggunakan *fallback* berupa `[Author] Signed at [YYYY/MM/DD]` jika alasan kosong.

- **Tanggal/Waktu:** 2026-06-11T07:22:00Z
- **Tugas yang diselesaikan:** Implement Google Drive Refresh Token (Opsi B) & Fallback UI (Opsi A) & Fix PDF Gap
- **File yang diubah/dibuat:** `User.php`, `SocialiteController.php`, `api.php`, `popup.html`, `popup.js`, `service-worker.js`, `Dashboard.jsx`, `SignDocument.jsx`
- **Status saat ini:** Selesai (Extension Version: 1.1.1)
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengimplementasikan alur auto-refresh Google Drive token di sisi backend untuk mencegah token kadaluarsa (401). Mengimplementasikan UI fallback bertuliskan "Saved Locally" apabila unggahan GDrive gagal baik di ekstensi maupun dashboard Web. Menghapus jarak abu-abu pada canvas PDF dengan menggunakan `width: 100%; height: auto;` di `popup.html` Ekstensi. Semua perubahan ekstensi telah di-*commit* dengan tag `ext-v1.1.1` dan memicu CI/CD.

- **Tanggal/Waktu:** 2026-06-11T07:35:00Z
- **Tugas yang diselesaikan:** Add "View on Drive" to Extension & Implement Timestamp Prefix
- **File yang diubah/dibuat:** `SignDocument.jsx`, `popup.js` (Chrome & Safari), `popup.html` (Chrome & Safari), `package.json` (Web & Ext), `manifest.json`
- **Status saat ini:** Selesai (Web: 1.1.1, Ext: 1.1.2)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menambahkan tombol "View on Drive" pada Extension UI (muncul jika `drive_url` tersedia). Menambahkan prefix `signed_web_YYYY.MM.DD_HH-mm-ss-` dan `signed_ext_YYYY.MM.DD_HH-mm-ss-` pada proses penamaan file baik di GDrive maupun lokal untuk membedakan sumber sign dan mencegah duplikasi nama. Tags `web-v1.1.1` dan `ext-v1.1.2` telah dipush ke repository.

- **Tanggal/Waktu:** 2026-06-11T07:58:00Z
- **Tugas yang diselesaikan:** Fix View on Drive layout and gdriveUrl property
- **File yang diubah/dibuat:** `popup.js` (Chrome & Safari), `popup.html` (Chrome & Safari), `package.json` (Ext), `manifest.json`
- **Status saat ini:** Selesai (Ext: 1.1.3)
- **Catatan untuk AI selanjutnya (Handoff Note):** Memperbaiki peletakan layout "Download" dan "View in Drive" menjadi *side-by-side* menggunakan CSS flexbox (karena sebelumnya menumpuk). Memperbaiki *bug* properti *response object* dari *background script* (di mana sebelumnya frontend mengekspektasikan `res.drive_url` padahal object tersebut bernama `res.gdriveUrl`) sehingga tombol tidak pernah dimunculkan. Menambahkan tag `ext-v1.1.3`.

- **Tanggal/Waktu:** 2026-06-11T08:04:00Z
- **Tugas yang diselesaikan:** Shorten button text and apply i18n
- **File yang diubah/dibuat:** `popup.js` (Chrome & Safari), `popup.html` (Chrome & Safari), `package.json` (Ext), `manifest.json`
- **Status saat ini:** Selesai (Ext: 1.1.4)
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengubah teks panjang tombol "Download Signed PDF" menjadi "Download" dan menyederhanakan teks "View in Drive" menjadi "View" dengan mempertahankan dukungan multibahasa (i18n). Menambahkan elemen `<span id="btn-view-drive-text">` untuk membungkus teks *View in Drive* agar pergantian bahasa tidak menghapus elemen SVG di sebelahnya. Menambahkan *key* translasi `btn_view_drive` di seluruh pustaka bahasa (EN, ID, TH). Mendorong perubahan melalui versi `ext-v1.1.4`.

- **Tanggal/Waktu:** 2026-06-11T08:13:00Z
- **Tugas yang diselesaikan:** Fix Detached Popup API Fetch Error
- **File yang diubah/dibuat:** `background.js` (Safari), `service-worker.js` (Chrome), `package.json` (Ext), `manifest.json`
- **Status saat ini:** Selesai (Ext: 1.1.5)
- **Catatan untuk AI selanjutnya (Handoff Note):** Memperbaiki bug "Failed to fetch" yang terjadi secara khusus saat user me-*detach* popup menjadi jendela mandiri/terpisah. Bug ini terjadi karena `sender.tab.url` pada jendela detached memiliki origin `chrome-extension://...` yang kemudian secara keliru dijadikan `baseUrl` oleh *background script*. Memperbaiki logika deteksi `baseUrl` di dalam *listener* pesan dengan menggunakan nilai `baseUrl` langsung dari `chrome.storage.local` dan memberikan *fallback* jika origin `chrome-extension` terdeteksi. Mendorong perubahan via versi `ext-v1.1.5`.

- **Tanggal/Waktu:** 2026-06-11T08:33:00Z
- **Tugas yang diselesaikan:** Extension Version Verification & UI Integration
- **File yang diubah/dibuat:** `content.js` (Chrome & Safari), `HandleInertiaRequests.php`, `Dashboard.jsx`, `messages/*.json`, `package.json` (Web & Ext), `manifest.json`
- **Status saat ini:** Selesai (Web: 1.1.2, Ext: 1.1.6)
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengimplementasikan fitur pengecekan versi ekstensi langsung dari *Dashboard Web*. 
  1. `content.js` diperbarui untuk membalas pesan `TRUSTLESS_PING_REQUEST` dengan mengirimkan versi dari `manifest`.
  2. `HandleInertiaRequests.php` mengirimkan versi minimal (berasal dari `package.json` web dan ekstensi) ke UI.
  3. `Dashboard.jsx` membandingkan (secara SemVer) versi ekstensi terinstal dengan `extensionMinVersion`.
  4. Footer Dashboard diperbarui dengan indikator status versi secara *real-time*.
  5. Fitur klik "Sign New Document" kini memiliki mekanisme *guard*: Jika ekstensi tidak terinstal atau *outdated*, user akan ditahan oleh modal pemberitahuan beserta tombol unduhan untuk *update*. Semua teks dilokalisasi. Tag dirilis `web-v1.1.2` dan `ext-v1.1.6`.

- **Tanggal/Waktu:** 2026-06-11T12:05:00Z
- **Tugas yang diselesaikan:** Add Macbook Air Tailscale SSH & SCP sync with online detection fallback to CI/CD pipeline
- **File yang diubah/dibuat:** `.github/workflows/deploy.yml`, `docs/SDP.md`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Pengecekan status online Desktop-PC dan Macbook Air dilakukan dengan perintah `nc -z -w 3 <IP> 22` agar jika salah satu target offline/tidak aktif, proses sync dilewati (fallback) dan pipeline tidak error. Sync Ignored Files via SCP ke Macbook Air juga sudah ditambahkan dengan target folder `/Users/my/Documents/~dev/iseng/TrustLessSign` (`~/Documents/~dev/iseng/TrustLessSign`).

- **Tanggal/Waktu:** 2026-06-11T12:24:00Z
- **Tugas yang diselesaikan:** Fix `Cannot read properties of undefined (reading 'getManifest')` on invalidated extension context
- **File yang diubah/dibuat:** `content.js` (Chrome & Safari), `package.json`, `manifest.json` (Chrome & Safari)
- **Status saat ini:** Selesai (Ext: 1.1.8)
- **Catatan untuk AI selanjutnya (Handoff Note):** Memperbaiki Uncaught TypeError saat extension context terinvalidasi (karena instalasi baru atau reload, namun tab dashboard masih terbuka). Logika pengecekan `chrome.runtime` dipindah ke awal listener di `content.js` dan segera mengembalikan error ke window untuk di-handle oleh React. Selain itu, menjelaskan ke user bahwa "No cryptographic key found" pada device baru bukanlah sebuah *error*, melainkan fitur inti Trustless architecture di mana private key baru harus di-generate per-device. Rilis tag `ext-v1.1.8`.

---

- **Tanggal/Waktu:** 2026-06-11T13:04:00Z
- **Tugas yang diselesaikan:** Implementasi **Hybrid Multi-Certificate Architecture** — Multi-Device + Google Drive Identity Backup (`.tsign`)
- **File yang diubah/dibuat:**
  - `web/database/migrations/2026_06_11_195402_add_device_name_to_certificates_table.php` — **[NEW]** Migrasi non-destruktif: menambah kolom `device_name` dan `device_identifier`
  - `web/app/Models/Certificate.php` — Tambah `device_name`, `device_identifier` ke `$fillable`
  - `web/app/Http/Controllers/CertificateController.php` — **[REFACTORED]** `myCertificate()` kini mengembalikan **array** sertifikat aktif. `issue()` menerima `device_name` & `device_identifier`. Menambah `revokeOwn()` untuk user self-service revocation per serial. Auto-revoke dihapus.
  - `web/routes/web.php` — Dashboard mengirim `activeCertificates` (array). `/certificates/me` mengembalikan array. Route baru: `POST /certificates/{serial}/revoke`
  - `chrome-extension/background/service-worker.js` — `handleGenerateKey()` meneruskan `device_name` & `device_identifier` ke backend. Tambah handler `UPLOAD_IDENTITY` → `handleUploadIdentity()`.
  - `chrome-extension/signing/gdrive.js` — Tambah fungsi `uploadIdentityToDrive()` yang menyimpan `.tsign` ke folder `TrustLessSign/Certificated/` di Google Drive user.
  - `chrome-extension/popup/popup.html` — Tambah input `device_name` di form keygen. Tambah tombol "Backup to Drive (.tsign)" dan "Import Identity (.tsign)".
  - `chrome-extension/popup/popup.js` — Update `checkAuth()` untuk parsing response array. Update `btnGenerateCert` meneruskan `deviceName`. Tambah handler backup & import `.tsign`. Tambah fungsi crypto: `encryptIdentityToTsign()`, `decryptIdentityFromTsign()`, `deriveKeyFromPassword()` (PBKDF2+AES-GCM+App-Salt), `generateDeviceIdentifier()`.
  - `safari-extension/Resources/*` — **Sync** dari Chrome extension.
  - `web/resources/js/Pages/Dashboard.jsx` — Consume `activeCertificates` array. Tampilkan daftar perangkat aktif (device list). Input `deviceName` di modal. Ubah warna tombol dari danger→primary (add device, bukan replace).
  - `chrome-extension/background/service-worker.bundle.js` — Rebuild.
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):**
  - **Database**: Migrasi sudah dijalankan (`php artisan migrate --force`). Kolom `device_name` (nullable string) dan `device_identifier` (nullable string) sudah ada di tabel `certificates`.
  - **Zero-Trust**: Private key TIDAK pernah dikirim ke server. Enkripsi `.tsign` dilakukan 100% client-side menggunakan WebCrypto API (PBKDF2+AES-GCM) dengan App-Level Salt `TrustLessSign_Identity_v1_DO_NOT_MODIFY`. Format file memiliki magic header `TSGN` (4 byte) untuk validasi.
  - **Multi-Device**: User dapat memiliki banyak sertifikat aktif (satu per device). Sertifikat lama TIDAK dicabut saat menambah device baru.
  - **Revocation**: User dapat mencabut sertifikat per-serial melalui route baru `POST /certificates/{serial}/revoke`. Admin masih bisa menggunakan route admin lama.
  - **Google Drive**: File `.tsign` disimpan di `TrustLessSign/Certificated/<timestamp>.tsign`.
  - **NEXT STEP**: Frontend web (Vite build) perlu di-rebuild oleh user. Perintah: `docker exec trustlesssign-app sh -c "cd /var/www/html && npm run build"`. Kemudian tag dan push: `git tag ext-v1.2.0 && git push origin main --tags`.

- **Tanggal/Waktu:** 2026-06-11T14:20:00Z
- **Tugas yang diselesaikan:** Bug Fixes Ekstensi (UI Label Overwriting, Missing Auto-Backup ke GDrive, dan Stray Return Statement).
- **File yang diubah/dibuat:** `chrome-extension/popup/popup.js`, `chrome-extension/background/service-worker.js`, `chrome-extension/signing/signer.js`, `safari-extension/Resources/popup.js`, `safari-extension/Resources/background.js`, `safari-extension/Resources/signing/signer.js`.
- **Status saat ini:** Selesai (Version `ext-v1.2.3`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Fungsionalitas pembuatan sertifikat lewat Web Dashboard sekarang akan secara otomatis men-trigger Service Worker untuk memaketkan file `.tsign` dan melakukan upload via OAuth Google Drive secara seamless. Hati-hati ketika memanipulasi function di `popup.js`, perhatikan sisa-sisa statement sebelumnya.
- **Tanggal/Waktu:** 2026-06-11T14:33:00Z
- **Tugas yang diselesaikan:** Bug Fixes Ekstensi Tahap 2 (arrayBufferToBase64 undefined & Active Device Identity Logic).
- **File yang diubah/dibuat:** `chrome-extension/popup/popup.js`, `chrome-extension/popup/popup.html`, `safari-extension/Resources/popup.js`, `safari-extension/Resources/popup.html`.
- **Status saat ini:** Selesai (Version `ext-v1.2.4`).
- **Catatan untuk AI selanjutnya (Handoff Note):** File `signer.js` sekarang sudah direferensikan ke dalam `popup.html` agar fungsi `arrayBufferToBase64` tidak hilang. Logika otentikasi ekstensi juga telah diperbarui; sekarang ia akan membaca `trustless_cert_serial` dari *local storage* untuk mencocokkan mana sertifikat yang **benar-benar aktif dan ada secara fisik** di perangkat tersebut, lalu menampilkannya di UI popup beserta Nama Device-nya. Tombol import/export `popup.js` juga diperbaiki *key*-nya.
- **Tanggal/Waktu:** 2026-06-11T14:57:00Z
- **Tugas yang diselesaikan:** Fitur Notifikasi Auto-Backup GDrive & Download Local `.tsign`.
- **File yang diubah/dibuat:** `chrome-extension/background/service-worker.js`, `safari-extension/Resources/background.js`, `chrome-extension/popup/popup.js`, `safari-extension/Resources/popup.js`, `chrome-extension/signing/signer.js`, `safari-extension/Resources/signing/signer.js`, `web/resources/js/Pages/Dashboard.jsx`.
- **Status saat ini:** Selesai (Version `ext-v1.2.5`).
- **Catatan untuk AI selanjutnya (Handoff Note):** File `signer.js` ditambahkan fungsi helper `base64ToBlob`. Background script sekarang me-return nilai status `driveSuccess` beserta base64 payload `.tsign` ke pemanggil UI. Popup ekstensi dan Web Dashboard (via `content.js`) kini menangkap *response* tersebut untuk menampilkan notifikasi "Auto-backed up" dan sebuah tombol spesifik untuk *Download Local Backup (.tsign)* secara langsung ke komputer pengguna, sementara fungsi manual "Backup to Drive" pada tab ekstensi tetap dipertahankan.

- **Tanggal/Waktu:** 2026-06-11T15:15:00Z
- **Tugas yang diselesaikan:** Fix UI Tombol Download untuk Mengarahkan ke Google Drive (URL `view`).
- **File yang diubah/dibuat:** `chrome-extension/signing/gdrive.js`, `safari-extension/Resources/signing/gdrive.js`, `chrome-extension/background/service-worker.js`, `safari-extension/Resources/background.js`, `chrome-extension/popup/popup.js`, `safari-extension/Resources/popup.js`, `web/resources/js/Pages/Dashboard.jsx`.
- **Status saat ini:** Selesai (Version `ext-v1.2.6`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Miskonsepsi dari UI sebelumnya: Pengguna tidak ingin mengunduh `.tsign` secara fisik ketika file tersebut sudah dicadangkan ke Google Drive. Fungsi `uploadIdentityToDrive` diubah agar me-return *Object* yang memuat `url` (tautan pratinjau Drive). UI Dashboard dan Ekstensi diubah sehingga menampilkan tombol *Open Google Drive Backup* jika `gdriveUrl` atau `driveUrl` tersedia. Jika dicadangkan tanpa izin GDrive (fallback lokal), barulah tombol mengunduh file secara lokal muncul. Tombol backup manual juga ditambahkan tautan GDrive ini.

- **Tanggal/Waktu:** 2026-06-11T15:23:00Z
- **Tugas yang diselesaikan:** Fix Bug Tombol Download `.tsign` Hilang Saat Token GDrive Kosong.
- **File yang diubah/dibuat:** `chrome-extension/background/service-worker.js`, `safari-extension/Resources/background.js`.
- **Status saat ini:** Selesai (Version `ext-v1.2.7`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Ditemukan sebuah *edge case* di mana blok `try-catch` saat men-generate file `.tsign` secara tidak sengaja terbungkus di dalam blok pengecekan eksistensi token `if (token) { ... }`. Hal ini menyebabkan Ekstensi tidak membuat file `.tsign` sama sekali jika pengguna belum login GDrive, sehingga tombol "Download Local Backup" tidak muncul pada halaman Web Dashboard maupun Ekstensi. Logika `encryptIdentityToTsign` sekarang telah digeser ke luar kondisi `token` sehingga file *blob* cadangan `.tsign` tetap ter-*generate* dan di-*return* secara independen meskipun Auto-Upload GDrive dibatalkan karena tidak ada sesi OAuth.

- **Tanggal/Waktu:** 2026-06-11T15:30:00Z
- **Tugas yang diselesaikan:** Fix Kontras Tombol pada Tampilan Ekstensi (Popup).
- **File yang diubah/dibuat:** `chrome-extension/popup/popup.js`, `safari-extension/Resources/popup.js`.
- **Status saat ini:** Selesai (Version `ext-v1.2.8`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Tombol notifikasi sukses yang disisipkan melalui Javascript di Ekstensi sebelumnya memiliki atribut `style` *inline* warna hijau cerah (`var(--accent-success)` atau `var(--accent-primary)`) yang memiliki kontras sangat buruk saat diletakkan di atas *background* elemen kotak `.alert-success` yang berwarna cerah. Kode Javascript (`popup.js`) di Chrome dan Safari telah direvisi dengan menghapus *style inline* tersebut, dan digantikan dengan _class_ standar bawaan tema aplikasi, yaitu `.btn-primary` dan `.btn-secondary`.

- **Tanggal/Waktu:** 2026-06-11T15:40:00Z
- **Tugas yang diselesaikan:** Fix 404 Error pada Halaman Verifikasi QR Code.
- **File yang diubah/dibuat:** `web/resources/js/Pages/Verify.jsx`.
- **Status saat ini:** Selesai (Version `web-v1.2.1`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Ditemukan kesalahan pada *endpoint* API yang diakses oleh komponen React `Verify.jsx`. Ia mencoba melakukan _fetch_ ke URL `/api/v1/verify/...` padahal pengaturan standar Laravel 11 (`bootstrap/app.php` & `api.php`) tidak menggunakan prefiks `v1`, melainkan hanya `/api/verify/...`. Prefiks `v1` telah dihapus dari kode _fetch_ sehingga QR Code yang dipindai tidak lagi memunculkan pesan _Not Valid (could not be found)_ di layar HP pengguna. Pastikan untuk meninjau _endpoint_ jika menambah fitur _React Component_ baru.

- **Tanggal/Waktu:** 2026-06-11T15:53:00Z
- **Tugas yang diselesaikan:** Fix *Mismatch* `verifyToken` antara QR Code dan Database.
- **File yang diubah/dibuat:** `chrome-extension/popup/popup.js`, `safari-extension/Resources/popup.js`, `web/resources/js/Pages/SignDocument.jsx`, `chrome-extension/background/service-worker.js`, `safari-extension/Resources/background.js`.
- **Status saat ini:** Selesai (Version `web-v1.2.2`, `ext-v1.2.9`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Ditemukan sebuah kecacatan arsitektur logika: Kode antarmuka (baik di *Web Dashboard* maupun di *Popup Ekstensi*) men-generate UUID `verifyToken` sendiri untuk digambar menjadi gambar QR Code. Namun, `verifyToken` ini tidak pernah diteruskan ke dalam objek *payload* menuju `service-worker.js`. Akibatnya, *service-worker* men-generate ulang UUID baru sebelum mendaftarkan metadata ke Laravel. Hal ini menyebabkan URL di QR Code tidak cocok dengan data di Database (selalu mereturn Not Found 404/400 Invalid). Solusinya: antarmuka sekarang melewatkan `verifyToken` aslinya melalui *payload*, dan *service-worker* akan menggunakannya alih-alih membuat UUID baru.

- **Tanggal/Waktu:** 2026-06-11T16:10:00Z
- **Tugas yang diselesaikan:** Ubah teks *tooltip hover* pada area kotak drag QR Code.
- **File yang diubah/dibuat:** `web/resources/js/Pages/SignDocument.jsx`.
- **Status saat ini:** Selesai (Version `web-v1.2.3`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Pengguna meminta untuk mengganti teks "QR Position: x:..., y:..." yang muncul saat _hover_ kotak QR pada antarmuka *Web Dashboard* menjadi kalimat "Drag to place the signature that appears on the Document". Perubahan telah dilakukan dan tag `web-v1.2.3` telah dirilis.

- **Tanggal/Waktu:** 2026-06-11T16:17:00Z
- **Tugas yang diselesaikan:** Menambahkan *tooltip hover* pada kotak drag QR Code di antarmuka Popup Ekstensi.
- **File yang diubah/dibuat:** `chrome-extension/popup/popup.html`, `safari-extension/Resources/popup.html`.
- **Status saat ini:** Selesai (Version `ext-v1.2.10`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Pengguna meminta ekstensi peramban memiliki fungsi *tooltip* instruksional "Drag to place the signature that appears on the Document" yang serupa dengan *Web Dashboard*. Pembaruan telah dilakukan dan dikomit dengan tag `ext-v1.2.10`.

- **Tanggal/Waktu:** 2026-06-11T16:25:00Z
- **Tugas yang diselesaikan:** Memperbaiki *bug* fatal (infinite loop) yang menyebabkan tab Web Dashboard *crash* dan *freeze* ketika ekstensi di-reload. Menangani *Extension Context Invalidated*.
- **File yang diubah/dibuat:** `chrome-extension/content.js`, `safari-extension/Resources/content.js`.
- **Status saat ini:** Selesai (Version `ext-v1.2.11`).
- **Catatan untuk AI selanjutnya (Handoff Note):** Ditemukan kesalahan di mana *content script* terus-menerus membalas dirinya sendiri dengan *error message* secara *looping* jika *Extension Context Invalidated* terjadi. Kini *content script* hanya akan memproses `type` yang valid dari Dashboard dan menahan agar ping tidak *crash*. Karena perbaikan ini, jika pengguna me-reload ekstensi, Dashboard hanya akan memunculkan status "Not Installed" (sebagai perilaku Normal dan aman) yang dapat diatasi cukup dengan menekan tombol **F5 (Refresh)** pada tab Dashboard.

- **Tanggal/Waktu:** 2026-06-12T06:36:00Z
- **Tugas yang diselesaikan:** Implementasi Final "Trustless Certificate Enforcement" sesuai Plan (Auto-revoke, Document Register Guard, Sync Check Dashboard, Extension pre-sign check, dan 3-Layer Verify Page UI dengan status oranye/merah).
- **File yang diubah/dibuat:**
  - `web/app/Http/Controllers/CertificateController.php`
  - `web/app/Http/Controllers/DocumentController.php`
  - `web/app/Http/Controllers/VerificationController.php`
  - `web/routes/web.php`
  - `chrome-extension/content.js`
  - `chrome-extension/popup/popup.js`
  - `web/resources/js/Pages/Dashboard.jsx`
  - `web/resources/js/Pages/Verify.jsx`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Arsitektur keamanan Trustless sudah tertutup rapat. Web tidak lagi percaya begitu saja pada database tanpa cross-check ke extension. Saat generate sertifikat baru, sertifikat lama akan di-revoke secara otomatis oleh sistem, memicu peringatan (oranye) pada dokumen-dokumen lama saat diverifikasi. Ekstensi kini memiliki peran sebagai single source of truth untuk `sync-check` keamanan sebelum `Dashboard.jsx` atau `popup.js` mengizinkan user untuk melakukan proses penandatanganan dokumen baru. Halaman Verifikasi memilik 3-layer status (Hijau/Oranye/Merah) lengkap dengan catatan khusus untuk sertifikat kadaluarsa/revoke.

- **Tanggal/Waktu:** 2026-06-13T05:56:00Z
- **Tugas yang diselesaikan:** Fix Bug — Banner "Sertifikat telah di-revoke" (oranye) tidak hilang setelah generate sertifikat baru
- **File yang diubah/dibuat:** `web/resources/js/Pages/Dashboard.jsx`
- **Status saat ini:** Selesai (Version `web-v1.2.5`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Root cause: setelah `handleGenerateCertificate` berhasil dan `router.reload()` dipanggil, state `syncStatus` (yang masih menyimpan `{ status: 'revoked' }` dari sertifikat lama) tidak di-reset. `router.reload()` me-remount komponen sehingga useEffect sync-check re-run otomatis — tidak perlu counter trigger tambahan. Fix: ditambahkan helper `handleCertActivated()` yang memanggil `setModalOpen(false)` + `setSyncStatus(null)` (menghapus banner lama secara instan sebagai feedback visual) + `router.reload()` (remount komponen, sync-check re-run fresh). Helper ini digunakan di dua callsite: auto-close (setTimeout 2 detik) dan tombol "Close & Continue" pada flow backup file.

- **Tanggal/Waktu:** 2026-06-13T06:13:00Z
- **Tugas yang diselesaikan:** Koreksi SSOT — Sinkronisasi `web/package.json` ke versi `1.2.5` (SemVer Strict Versioning §4.2)
- **File yang diubah/dibuat:** `web/package.json`
- **Status saat ini:** Selesai (Version `web-v1.2.5`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Ditemukan pelanggaran Strict Versioning Rules §4.2 — tag `web-v1.2.4` dan `web-v1.2.5` sudah di-push ke GitHub tanpa memperbarui `web/package.json` terlebih dahulu sebagai SSOT. `package.json` masih di `1.2.3` sementara tag sudah di `1.2.5`. Koreksi: `version`, `version_name` diupdate ke `1.2.5` dan `version_code` ke `125`. **PERHATIAN UNTUK AI SELANJUTNYA:** Selalu update `package.json` SEBELUM membuat git tag. Urutan wajib: (1) Edit `package.json` → (2) `git commit` → (3) `git tag web-vX.Y.Z` → (4) `git push origin main --tags`.

- **Tanggal/Waktu:** 2026-06-13T07:45:00Z
- **Tugas yang diselesaikan:** Fix Bug 404 pada Sinkronisasi Ekstensi (`sync-check`)
- **File yang diubah/dibuat:** `chrome-extension/popup/popup.js`
- **Status saat ini:** Selesai (Version Web `web-v1.2.7`, Ext `ext-v1.2.16`)
- **Catatan untuk AI selanjutnya (Handoff Note):** User melaporkan error ekstensi memunculkan status "Your certificate is no longer valid" secara sepihak dengan error Network 404 di endpoint `/api/certificates/sync-check`. Root cause: Route `sync-check` di backend Laravel didaftarkan di file `routes/web.php` tanpa prefix `/api`, sehingga URL aslinya adalah `/certificates/sync-check`. Namun, `popup.js` di chrome-extension memanggil endpoint tersebut dengan tambahan prefix `/api` sehingga mendapatkan error 404 dari Nginx. Fix: Prefix `/api` telah dihapus dari URL fetch di `popup.js`.

- **Tanggal/Waktu:** 2026-06-13T08:38:00Z
- **Tugas yang diselesaikan:** Fix Bug 419 (Page Expired) pada Sinkronisasi Ekstensi (`sync-check`)
- **File yang diubah/dibuat:**
  - `web/bootstrap/app.php`
  - `web/package.json`
- **Status saat ini:** Selesai (Version Web `web-v1.2.8`)
- **Catatan untuk AI selanjutnya (Handoff Note):** User melaporkan error 419 pada endpoint `tsign.vnot.my.id/certificates/sync-check`. Root cause: Endpoint tersebut didaftarkan di `routes/web.php` untuk memfasilitasi panggilan dari ekstensi yang tanpa prefix `/api` (sebelumnya diubah karena error 404), namun secara default Laravel menerapkan middleware validasi CSRF pada rute `POST` di web. Karena ekstensi mengautentikasi via token Bearer Sanctum dan bukan *cookie session browser* biasa, tidak ada token CSRF yang disertakan sehingga Laravel menolak dengan 419. Fix: Rute `certificates/sync-check` telah dikecualikan secara eksplisit dari perlindungan CSRF di dalam blok `withMiddleware` pada `bootstrap/app.php`. Rilis Web telah di-bump ke versi `1.2.8`.

- **Tanggal/Waktu:** 2026-06-13T08:58:00Z
- **Tugas yang diselesaikan:** Menambahkan notifikasi wajib generate/import sertifikat jika tidak ada sertifikat yang terdeteksi
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.js`
  - `safari-extension/Resources/popup.js`
  - `chrome-extension/package.json`
  - `chrome-extension/manifest.json`
  - `safari-extension/Resources/manifest.json`
- **Status saat ini:** Selesai (Version Ext `ext-v1.2.17`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Sesuai permintaan, jika ekstensi peramban memuat status autentikasi namun gagal menemukan setidaknya satu sertifikat yang aktif untuk perangkat ini (`activeCert === undefined / null`), kini aplikasi akan memunculkan sebuah *alert box* bertuliskan `"NO CERTIFICATE FOUND\nPlease import or generate a secure cryptographic key on Tab Keys & Cert."`. Setelah pengguna menekan tombol "OK" pada alert box tersebut, ekstensi akan mengeksekusi `tabKeys.click()` yang langsung membawanya ke panel menu *Keys & Cert* secara otomatis. Ekstensi di-*bump* ke `1.2.17`.

- **Tanggal/Waktu:** 2026-06-13T09:28:00Z
- **Tugas yang diselesaikan:** Refactor "No Certificate" Alert menjadi Custom Modal berbasis Bio-Digital Minimalism
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.html`
  - `chrome-extension/popup/popup.js`
  - `safari-extension/Resources/popup.html`
  - `safari-extension/Resources/popup.js`
  - `chrome-extension/package.json`
  - `chrome-extension/manifest.json`
  - `safari-extension/Resources/manifest.json`
- **Status saat ini:** Selesai (Version Ext `ext-v1.2.18`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Penggunaan fungsi bawaan peramban `alert()` dibatalkan karena tidak mematuhi standar desain *Bio-Digital Minimalism 2026*. Sebagai gantinya, sebuah *custom modal overlay* (`#no-cert-modal`) telah diintegrasikan ke dalam antarmuka ekstensi (`popup.html`). Modal ini mengaplikasikan lapisan *backdrop-filter blur*, menggunakan ikon peringatan dengan palet *accent-danger* (sebagai *multi-visual indicator* pemenuhan standar A11y buta warna), dan mengadopsi animasi kemunculan berskala (*scale & opacity transition*). Setelah tombol "Acknowledge & Setup" diklik, modal akan ditutup secara halus dan aksi `tabKeys.click()` akan dieksekusi. Versi ekstensi dinaikkan menjadi `1.2.18`.

- **Tanggal/Waktu:** 2026-06-13T09:37:00Z
- **Tugas yang diselesaikan:** Mengganti fungsi `prompt()` bawaan OS dengan Custom Password Modal (Bio-Digital Minimalism 2026) pada fitur Backup & Import Identity.
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.html`
  - `chrome-extension/popup/popup.js`
  - `safari-extension/Resources/popup.html`
  - `safari-extension/Resources/popup.js`
  - `chrome-extension/package.json`
  - `chrome-extension/manifest.json`
  - `safari-extension/Resources/manifest.json`
- **Status saat ini:** Selesai (Version Ext `ext-v1.2.19`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Sama seperti perbaikan sebelumnya pada `alert()`, penggunaan `prompt()` sistem untuk meminta *Master Password* pada saat mengekspor (Backup ke GDrive) atau mengimpor file identitas `.tsign` telah dihapus. Alur diganti menjadi proses asinkron (`Promise-based`) yang memanggil *Custom Password Modal Overlay* (`#password-prompt-modal`). Modal baru ini memiliki bilah *input password* dengan fungsionalitas `toggle show/hide`, mendukung kontrol papan ketik (Enter/Escape), serta diselaraskan dengan estetika HSL yang ditetapkan pada dokumen desain. Versi ekstensi dinaikkan ke `1.2.19`.

- **Tanggal/Waktu:** 2026-06-13T10:05:00Z
- **Tugas yang diselesaikan:** Implementasi Sprint 1: Backend Foundation untuk fitur Image Signature Support
- **File yang diubah/dibuat:**
  - `web/database/migrations/..._create_user_signatures_table.php`
  - `web/database/migrations/..._add_signature_image_id_to_documents_table.php`
  - `web/app/Models/ImageSignature.php`
  - `web/app/Services/ImageSignatureService.php`
  - `web/app/Http/Requests/UploadSignatureRequest.php`
  - `web/app/Http/Controllers/Api/SignatureController.php`
  - `web/routes/api.php`
  - `web/app/Console/Commands/CleanupUnusedSignatures.php`
  - `web/routes/console.php`
- **Status saat ini:** Selesai (Sprint 1)
- **Catatan untuk AI selanjutnya (Handoff Note):** Seluruh arsitektur backend untuk fitur penyematan gambar tanda tangan (Sprint 1) telah selesai. Skema database menggunakan relasi UUID. API endpoints telah dibuat di bawah rute `api/v1/signatures/*`. Validasi gambar, sanitasi ukuran maksimum 5MB, serta `CleanupUnusedSignatures` command telah dikonfigurasi. Untuk AI berikutnya, silakan melanjutkan ke Sprint 2 (Chrome Extension UI) dengan membangun Modal dan Signature Gallery di antarmuka ekstensi menggunakan API endpoints yang baru saja disediakan.

- **Tanggal/Waktu:** 2026-06-13T10:55:00Z
- **Tugas yang diselesaikan:** REVISI ARSITEKTUR Kritis - Rollback Sprint 1 (Zero-Knowledge Compliance)
- **File yang diubah/dibuat:**
  - Menghapus semua file Backend yang dibuat pada `web-v1.3.0-alpha1` (Migration, Model, Controller, Service).
  - Me-*rollback database*.
- **Status saat ini:** Selesai (Revert `web-v1.3.0-alpha1`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Peringatan keras: Proyek ini menganut filosofi **Trustless / Zero-Knowledge**. Instruksi awal pada `image-signature-task.md` (Sprint 1 Backend) ternyata melanggar filosofi aplikasi karena mencoba menyimpan gambar tanda tangan pengguna di server/S3 yang dikendalikan oleh backend Laravel. Sistem telah di-*rollback* sepenuhnya. Solusi yang benar: Seluruh pengelolaan gambar tanda tangan (CRUD) **WAJIB** dilakukan langsung dari Ekstensi Chrome/Safari ke **Google Drive pengguna**, tanpa pernah menyentuh *backend* Laravel. File `SDP.md` ini menjadi saksi pembatalan Sprint 1. AI selanjutnya WAJIB langsung merancang penyimpanan via API Google Drive di sisi ekstensi (*Sprint 2*).

- **Tanggal/Waktu:** 2026-06-13T11:15:00Z
- **Tugas yang diselesaikan:** Implementasi Sprint 2 (Frontend UI) untuk Image Signatures via API Google Drive
- **File yang diubah/dibuat:**
  - `chrome-extension/signing/gdrive.js` (Fungsi Upload/Fetch Image ke Drive)
  - `chrome-extension/popup/popup.html` (Penambahan Galeri & Tombol Upload)
  - `chrome-extension/popup/popup.js` (Logika UI Galeri)
  - Disinkronisasikan ke `safari-extension`
  - Manifest version *bump* ke `1.3.0`
- **Status saat ini:** Selesai (Sprint 2 - Versi Ekstensi `ext-v1.3.0`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengacu pada aturan `Trustless Architecture`, fitur *Image Signature* kini menyimpan data 100% di akun Google Drive pengguna. Fungsi di `gdrive.js` telah diperluas untuk mengelola direktori `TrustLessSign/ImageSignatures`. Di tab *Keys & Cert*, galeri tanda tangan visual berhasil dirender. Pengguna dapat mengunggah (ukuran dibatasi maks 5MB), melihat pratinjau mini, menetapkan tanda tangan utama (*default*), dan menghapusnya (*double-click*). Semua fungsi memanfaatkan token Drive dari *storage local*. Langkah selanjutnya untuk AI (Sprint 3) adalah mengintegrasikan penyematan gambar ini langsung ke dokumen PDF via `pdf-lib.js` saat proses penandatanganan (Sign PDF).

- **Tanggal/Waktu:** 2026-06-13T11:42:00Z
- **Tugas yang diselesaikan:** Pembaruan Desain Fallback & Refactoring Dokumen Perencanaan (Zero-Knowledge)
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.js`
  - `safari-extension/Resources/popup.js`
  - `docs/new/image-signature-implementation_plan.md`
  - `docs/new/image-signature-task.md`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Tampilan peringatan (*fallback*) ketika ekstensi gagal memuat daftar *Visual Signatures* dari Google Drive telah diperbarui agar selaras dengan panduan *Bio-Digital Minimalism 2026*. Menampilkan ikon berpalet `accent-danger` dengan gaya terstruktur. Selain itu, dokumen `implementation_plan.md` dan `image-signature-task.md` telah ditulis ulang (*rewritten*) sepenuhnya. Dokumen tersebut kini menolak sama sekali gagasan penggunaan database backend dan mendelegasikan otoritas penuh pada arsitektur Trustless / Zero-Knowledge menggunakan API Google Drive.

- **Tanggal/Waktu:** 2026-06-13T11:58:00Z
- **Tugas yang diselesaikan:** Perbaikan teks Fallback "Failed to load signatures" dan Penambahan Batas Ukuran File (25MB)
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.js`
  - `safari-extension/Resources/popup.js`
  - `docs/new/image-signature-implementation_plan.md`
  - `docs/new/image-signature-task.md`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Teks kesalahan pada UI Galeri *Visual Signatures* dikembalikan menjadi pesan lugas "Failed to load signatures" sambil tetap mempertahankan balutan desain *aesthetic* kotak peringatan `accent-danger-soft`. Selain itu, batas ambang ukuran gambar (*file size limit*) pada berkas perencanaan dan logika validasi ekstensi telah ditingkatkan dari `5MB` menjadi `25MB`.

- **Tanggal/Waktu:** 2026-06-13T12:05:00Z
- **Tugas yang diselesaikan:** Push dan Tag Release Sinkronisasi Ekstensi
- **File yang diubah/dibuat:**
  - `chrome-extension/package.json`
  - `chrome-extension/manifest.json`
  - `safari-extension/Resources/manifest.json`
  - `docs/releases/trustlesssign-v1.3.1.crx`
- **Status saat ini:** Selesai (Version Ext `ext-v1.3.1`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Ekstensi versi 1.3.1 telah di-bump, di-build menjadi `.crx`, di-commit dan diberi tag `ext-v1.3.1` agar pipeline CI/CD mengeksekusi sinkronisasi file ke PC Desktop lokal pengguna via Tailscale. Tanpa Git Tag dengan prefix `ext-v`, proses sinkronisasi tidak akan terjadi.

- **Tanggal/Waktu:** 2026-06-13T12:20:00Z
- **Tugas yang diselesaikan:** Fix Bug `uploadImageSignature is not defined`
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.html`
  - `safari-extension/Resources/popup.html`
- **Status saat ini:** Selesai (Version Ext `ext-v1.3.2`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Ditemukan kesalahan penulisan (*import*) skrip pada antarmuka *popup*. Fungsi manajemen `uploadImageSignature` dideklarasikan pada file terpisah (`gdrive.js`), namun file skrip tersebut belum disisipkan ke dalam tag `<script>` pada dokumen HTML. Hal ini mengakibatkan aksi pengunggahan memicu kesalahan *ReferenceError*. Kesalahan telah diperbaiki dengan mengimpor `gdrive.js` dan dependensinya (`forge.min.js`) secara eksplisit ke struktur DOM. Versi telah di-bump menjadi `1.3.2`.

- **Tanggal/Waktu:** 2026-06-13T12:35:00Z
- **Tugas yang diselesaikan:** Fix Bug `Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')`
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.js`
  - `safari-extension/Resources/popup.js`
- **Status saat ini:** Selesai (Version Ext `ext-v1.3.3`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Ditemukan kesalahan inisialisasi akibat elemen DOM dengan ID `btn-theme-toggle` dan `extension-lang-select` absen secara permanen di kerangka `popup.html`, namun skrip `popup.js` secara agresif mencoba menyematkan *Event Listener* ke dalam ID tersebut. Hal ini menyebabkan antarmuka memblokir eksekusi di baris ke-315. Perbaikan dilakukan dengan menyuntikkan operator kondisional (`if (btnThemeToggle) { ... }`) untuk mencegah *null pointer exception*. Versi dirilis ke `1.3.3`.

- **Tanggal/Waktu:** 2026-06-13T12:45:00Z
- **Tugas yang diselesaikan:** Fix Bug `TypeError: Cannot read properties of null (reading 'addEventListener')` pada `btnPopout`.
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.js`
  - `safari-extension/Resources/popup.js`
- **Status saat ini:** Selesai (Version Ext `ext-v1.3.4`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Analisis lebih lanjut mengungkap kesalahan (*TypeError*) yang persis sama terulang pada pemanggilan fungsi `btnPopout.addEventListener`. Fitur `btnPopout` rupanya juga telah direvisi dari struktur DOM `popup.html`. Perbaikan identik (*null safety conditional*) telah diaplikasikan pada baris-baris pemanggil variabel `btnPopout` untuk memitigasi kegagalan muat antarmuka secara keseluruhan. Ekstensi rilis `1.3.4`.

- **Tanggal/Waktu:** 2026-06-13T12:55:00Z
- **Tugas yang diselesaikan:** Fix Fatal Bug DOM Terpotong (Truncated `popup.html`)
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.html`
  - `safari-extension/Resources/popup.html`
- **Status saat ini:** Selesai (Version Ext `ext-v1.3.5`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Analisis lebih dalam terhadap rentetan error `addEventListener` pada `btnPopout` dan `btnLoginGoogle` mengungkap bahwa seluruh konten `<body>` di dalam berkas `popup.html` secara tidak sengaja terhapus (terpotong) pada saat manipulasi injeksi skrip `<script>` di rilis `1.3.2`. Hal ini menyebabkan hampir semua *event listener* gagal karena elemen UI tidak eksis. Berkas `popup.html` telah dipulihkan (*restore*) ke keadaan aslinya secara penuh dan urutan impor *script* (`forge.min.js`, `gdrive.js`) telah diletakkan di tempat yang benar pada bagian bawah DOM. Ekstensi di-bump ke `1.3.5`.

- **Tanggal/Waktu:** 2026-06-13T13:10:00Z
- **Tugas yang diselesaikan:** Fix Bug Flicker UI dan Migrasi Penyimpanan Gambar Tanda Tangan ke IndexedDB Lokal
- **File yang diubah/dibuat:**
  - `chrome-extension/signing/local-db.js` (Baru - Wrapper IndexedDB)
  - `chrome-extension/popup/popup.js` (Memperbarui logika Gallery)
  - `chrome-extension/popup/popup.html` (Impor script `local-db.js`)
  - Disinkronisasikan ke `safari-extension`
- **Status saat ini:** Selesai (Version Ext `ext-v1.3.6`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Merespons keluhan terkait kedipan UI (*flicker*) saat pengguna mengeklik gambar tanda tangan (Selection), masalah ini berakar dari proses `refreshImageSignatures()` yang sebelumnya selalu me-*reload* seluruh daftar gambar dari Google Drive API secara penuh setiap kali terjadi perubahan status *default*. Selain itu, arsitektur penyimpanan juga direvisi: Sesuai arahan baru, gambar tanda tangan tidak lagi langsung diunggah ke Google Drive saat dipilih, melainkan ditampung ke penyimpanan *IndexedDB* lokal peramban (melalui `local-db.js`). Logika UI kini langsung memperbarui kelas CSS secara instan saat seleksi gambar dilakukan sehingga bebas kedipan. Gambar baru akan ikut terunggah ke Drive nantinya saat proses *Sign PDF* dieksekusi bersamaan dengan dokumen PDF (akan diimplementasi di *Sprint 3*). Versi ekstensi naik ke `1.3.6`.

- **Tanggal/Waktu:** 2026-06-13T13:30:00Z
- **Tugas yang diselesaikan:** Redesign UI Login Status "Connecting to Google..."
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.js`
  - `chrome-extension/popup/popup.html`
  - `safari-extension/Resources/popup.js`
  - `safari-extension/Resources/popup.html`
- **Status saat ini:** Selesai (Version Ext `ext-v1.3.7`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Sebelumnya, status pemuatan otorisasi ("Connecting to Google...") dirender hanya sebagai teks statis berwarna merah (`var(--accent-danger)`) karena konfigurasi *hardcode* pada elemen `#login-status`. Pendekatan ini tidak sesuai dengan prinsip desain aplikasi yang mengutamakan indikator multi-visual. Modifikasi dilakukan dengan membangun fungsi pendukung `setLoginStatus(state, text)` pada skrip `popup.js` untuk mengontrol CSS secara dinamis. Status '*loading*' kini memunculkan *spinner SVG* berwarna biru kehijauan dengan latar '*surface-secondary*', sedangkan status gagal dikembalikan ke mode peringatan merah putus-putus. Versi rilis diperbarui ke `1.3.7`.

- **Tanggal/Waktu:** 2026-06-13T14:00:00Z
- **Tugas yang diselesaikan:** Implementasi Efek Glow Hijau pada Active Device Card & Bumping Web Version ke 1.2.9
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/Dashboard.jsx`
  - `web/package.json`
- **Status saat ini:** Selesai (Version Web `web-v1.2.9`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengubah layout kartu perangkat aktif pada halaman Dashboard utama agar memancarkan bayangan/glow hijau lembut saat kursor diletakkan di atasnya (`group hover:border-accent-primary/40 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_0_28px_rgba(16,185,129,0.12)]`). Menyelaraskan warna badge lingkaran nomor urut menjadi `bg-accent-success-soft` dan `text-accent-success` dari yang sebelumnya menggunakan `bg-accent-primary-soft`. Melakukan bump versi web ke `1.2.9` di `web/package.json` dan memicu build produksi Vite. Tag `web-v1.2.9` telah dibuat dan di-push untuk memicu proses CI/CD deployment.

- **Tanggal/Waktu:** 2026-06-13T14:45:00Z
- **Tugas yang diselesaikan:** Modifikasi Browser Extension pada Card Profil Google User
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.html`
  - `safari-extension/Resources/popup.html`
  - `chrome-extension/package.json`
  - `chrome-extension/manifest.json`
  - `safari-extension/Resources/manifest.json`
- **Status saat ini:** Selesai (Version Ext `ext-v1.3.9`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Telah dilakukan perombakan antarmuka Card Profil pengguna di dalam ekstensi (baik untuk Google Chrome maupun Safari) sehingga penampilannya selaras dengan desain "Active Devices" pada Web Dashboard. Desain baru mengadopsi standar Bio-Digital Minimalism 2026 dengan menggunakan `var(--surface-secondary)` untuk latar belakang dan efek *glow* (menyala) Hijau Aestetik pada saat *hover*. Tombol *Logout* juga disesuaikan menjadi bergaya *danger-outline* transparan. Versi ekstensi telah diperbarui secara serentak menjadi `1.3.9`.

- **Tanggal/Waktu:** 2026-06-13T14:52:00Z
- **Tugas yang diselesaikan:** 
  - Membuat dan mengintegrasikan Canvas Barcode Signature Frame (`barcode-generator.js`) ke dalam proses penandatanganan dokumen di `popup.js` ekstensi (Phase 3). 
  - Mengimplementasikan Web Verify Scanner Integration (`/verify` page) yang menggunakan library `html5-qrcode` (Headless) untuk memindai Barcode/QR langsung dari kamera, lengkap dengan antarmuka pindai khusus dan kolom input Short ID secara manual (Phase 4).
  - Mengubah `VerificationController.php` untuk mendukung pencarian berdasarkan Short ID (`TLS-XXXX`).
- **File yang diubah/dibuat:**
  - `chrome-extension/popup/popup.js` (Memanggil `generateSignatureFrame` untuk pembuatan frame tanda tangan dengan opsi barcode/QR)
  - `safari-extension/Resources/popup.js` (Disinkronkan)
  - `web/routes/web.php` (Memperbolehkan token sebagai opsional di rute `/verify`)
  - `web/app/Http/Controllers/VerificationController.php` (Pencarian berbasis `LIKE` untuk Short ID)
  - `web/resources/js/Pages/Verify.jsx` (Integrasi Scanner UI dan Manual Input)
  - `web/package.json` (Penambahan `html5-qrcode`)
- **Status saat ini:** Selesai (Phase 3 dan Phase 4 sudah diimplementasikan).
- **Catatan untuk AI selanjutnya (Handoff Note):** Halaman verifikasi sudah dapat melakukan scanning dan pencarian ID dengan prefix TLS-. Pastikan pipeline CI/CD dijalankan atau `npm run build` dieksekusi oleh user di sisi klien untuk melihat perubahan pada antarmuka web. Evaluasi workflow penandatanganan keseluruhan dengan menguji validasi verifikasi PDF.

- **Tanggal/Waktu:** 2026-06-13T14:52:00Z
- **Tugas yang diselesaikan:** Revisi Dokumen Perencanaan (Implementation Plan & Task) ke Arsitektur Zero Trust
- **File yang diubah/dibuat:**
  - `docs/new/image-signature-implementation_plan.md`
  - `docs/new/image-signature-task.md`
  - `docs/new/multiple-signature-implementation_plan.md`
  - `docs/new/multiple-signature-task.md`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Menyelaraskan ulang dokumen *Implementation Plan* dan *Task* agar mematuhi arsitektur *Zero Trust*. Pada fitur *Image Signature*, sinkronisasi dengan status terbaru di mana penyimpanan sementara kini dialihkan ke peramban lokal (`IndexedDB` melalui `local-db.js`) demi menghindari kedipan UI, dan bukan langsung ke Google Drive API. Pada fitur *Multiple Signature*, arsitektur direvisi sedemikian rupa agar *backend* Laravel tidak lagi menerima *file upload* PDF secara mentah, melainkan hanya berfungsi sebagai pengelola urutan *Workflow State Machine* yang menerima `document_hash` dan `encrypted_drive_url`.

- **Tanggal/Waktu:** 2026-06-15T14:39:49Z
- **Tugas yang diselesaikan:** Integrasi Fitur Visual Signature ke Web Dashboard (Phase 3)
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/SignDocument.jsx`
  - `chrome-extension/background/service-worker.js`
  - `chrome-extension/content.js`
  - `chrome-extension/signing/signer.js`
  - `safari-extension/Resources/background.js`
  - `safari-extension/Resources/content.js`
  - `safari-extension/Resources/signing/signer.js`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Telah diselesaikan tahap integrasi Web Dashboard (Phase 3 Image Signature). Halaman Web Dashboard `SignDocument.jsx` kini dapat mengambil `Visual Signature` langsung dari Extension lewat IndexedDB menggunakan Cross-Origin message (via `content.js` dan `background.js`). Fitur selector 'Signature Type' telah diimplementasikan, fallback alert telah disediakan jika user belum men-set default image, dan UI Draggable node otomatis me-render image preview. Safari Extension juga telah disinkronisasi.

- **Tanggal/Waktu:** 2026-06-15T15:14:50Z
- **Tugas yang diselesaikan:** Perbaikan Resolusi & Ukuran Visual Signature (Diperbesar 4x lipat untuk scan QR yang lebih mudah)
- **File yang diubah/dibuat:**
  - `web/resources/js/Utils/barcode-generator.js`
  - `web/resources/js/Pages/SignDocument.jsx`
  - `docs/new/image-signature-implementation_plan.md`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya:** Resolusi kanvas diperbesar 4x lipat (2400x1400) dan physical PDF box diubah dari 80 menjadi 320.

- **Tanggal/Waktu:** 2026-06-15T15:36:17Z
- **Tugas yang diselesaikan:** Bugfix GDrive Authentication Error (Invalid Credentials / 401)
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/SignDocument.jsx`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya:** Menambahkan fungsi Auto-Refresh GDrive Token sebelum proses eksekusi tanda tangan (melalui `/api/gdrive/refresh`) untuk mencegah token kedaluwarsa.

- **Tanggal/Waktu:** 2026-06-15T16:02:00Z
- **Tugas yang diselesaikan:** Penyesuaian Ulang Ukuran Tanda Tangan Visual (Diperkecil 2x)
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/SignDocument.jsx`
- **Status saat ini:** Selesai
  - `web/resources/js/Pages/SignDocument.jsx`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya:** Kanvas direvisi menjadi `400x300` (rasio 4:3). Tanda tangan gambar kini berada rata tengah secara absolut dengan `max-height: 140px` dan `object-fit: contain` logic, sehingga mengisi ruang kosong mendatar secara efisien. Kotak pratinjau Web disesuaikan menjadi `160x120px`.

- **Tanggal/Waktu:** 2026-06-15T17:29:00Z
- **Tugas yang diselesaikan:** Optimalisasi Ruang Kosong (Dead Space) pada Visual Signature
- **File yang diubah/dibuat:**
  - `web/resources/js/Utils/barcode-generator.js`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya:** Sesuai *mockup* pengguna, *padding* global dikurangi menjadi `12px`. Jarak antar elemen dipersempit. Limitasi buatan *max-height: 140px* pada gambar tanda tangan dihilangkan, sehingga gambar kini dapat membesar secara leluasa memenuhi seluruh area ruang kosong (Body) seluas `366x205px` tanpa merusak *aspect ratio*.

- **Tanggal/Waktu:** 2026-06-18T14:21:24Z
- **Tugas yang diselesaikan:** Penyesuaian UI Penanda tangan & Signature Type di Web Dashboard
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/SignDocument.jsx`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya:** Memindahkan dropdown Signature Type tepat di bawah Upload PDF agar sinkron dengan Extension. Menambahkan opsi Signer (Penanda Tangan) dengan mode 'username (Google)' yang memunculkan alert, dan mode 'Custom' yang akan mewajibkan pengguna mengetik nama manual agar tombol Sign & Seal bisa di-klik.

- **Tanggal/Waktu:** 2026-06-18T14:31:00Z
- **Tugas yang diselesaikan:** Fix Build Syntax Error & Version Bump (Web)
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/SignDocument.jsx`
  - `web/package.json`
- **Status saat ini:** Selesai (Version Web `web-v1.3.25`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Memperbaiki syntax error (missing closing tag div) pada `SignDocument.jsx` yang menyebabkan kegagalan pipeline build Vite akibat bug esbuild parsing. Melakukan bump versi web ke `1.3.25` di `web/package.json` dan memicu build produksi kembali melalui CI/CD.

- **Tanggal/Waktu:** 2026-06-18T14:47:00Z
- **Tugas yang diselesaikan:** Fix API Verification untuk QR Scanner
- **File yang diubah/dibuat:**
  - `web/app/Http/Controllers/VerificationController.php`
  - `web/package.json`
- **Status saat ini:** Selesai (Version Web `web-v1.3.26`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Memperbaiki *bug* 404 (Not Found) pada rute verifikasi `api/verify/`. URL hasil pemindaian kode QR mengirimkan Short ID yang tidak selalu memiliki *prefix* `TLS-` (misal: `/verify/7EBF782B`). Backend kini secara otomatis mendukung pencarian `LIKE` untuk *Short ID* yang berjumlah 8 karakter tanpa *prefix* tersebut, tidak lagi melakukan pencarian absolut `uuid` yang berakibat gagal ditemukannya data. Kenaikan versi dilakukan ke `1.3.26`.

- **Tanggal/Waktu:** 2026-06-18T14:55:00Z
- **Tugas yang diselesaikan:** Remove Redundant Badge di Verify.jsx
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/Verify.jsx`
  - `web/package.json`
- **Status saat ini:** Selesai (Version Web `web-v1.3.27`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menghapus badge `Certificate Valid/inValid` yang dirasa repetitif di halaman `Verify.jsx`, sesuai instruksi bahwa status sertifikat sudah terwakilkan pada bagian teks Capitalize berwarna yang berada tepat di bawahnya. Kenaikan versi ke `1.3.27` dan *push* telah dieksekusi.

- **Tanggal/Waktu:** 2026-06-18T15:00:30Z
- **Tugas yang diselesaikan:** Menambahkan "Verify at" URL di Barcode Samping PDF
- **File yang diubah/dibuat:**
  - `web/resources/js/Utils/barcode-generator.js`
  - `web/resources/js/Pages/SignDocument.jsx`
  - `web/package.json`
- **Status saat ini:** Selesai (Version Web `web-v1.3.28`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Telah memodifikasi fungsi `generatePageStamp` untuk menerima parameter URL verifikasi (`verifyUrlShort`) dari komponen utama. URL (berwarna hijau) dicetak satu baris di atas metadata *tSign ID* pada kanvas stempel margin PDF (ribbon horizontal yang akan diputar -90 derajat pada dokumen hasil penandatanganan). Kenaikan versi ke `1.3.28` beserta rilis tag sudah berhasil.

- **Tanggal/Waktu:** 2026-06-18T15:12:00Z
- **Tugas yang diselesaikan:** Update nama file backup extension & posisi watermark Verify At (PDF)
- **File yang diubah/dibuat:**
  - `web/resources/js/Utils/barcode-generator.js`
  - `chrome-extension/popup/popup.js`
  - `chrome-extension/background/service-worker.js`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** File backup ekstensi sekarang menggunakan format <DeviceName>_<username email>-yyyymmdd.tsign dan posisi "Verify At" di PDF sudah pindah ke bawah tSign ID.

- **Tanggal/Waktu:** 2026-06-18T15:34:00Z
- **Tugas yang diselesaikan:** Perbaikan teks terpotong di marginal stamp & Tambah alasan tanda tangan
- **File yang diubah/dibuat:**
  - `web/resources/js/Utils/barcode-generator.js`
  - `web/database/seeders/ReasonCategorySeeder.php`
- **Status saat ini:** Selesai (Version Web `web-v1.3.30`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Menambahkan ruang ekstra dengan memperlebar canvas marginal stamp dari 40px ke 48px agar teks "Verify At" tidak terpotong saat dirender. Selain itu, mengubah seeder alasan tanda tangan untuk menyertakan alasan Legal & Official serta Administrative yang diminta pengguna, kemudian melakukan *force seed* ulang ke DB di production container.

- **Tanggal/Waktu:** 2026-06-18T15:52:00Z
- **Tugas yang diselesaikan:** Mengembalikan format marginal stamp dan menambahkan footer verifikasi di PDF
- **File yang diubah/dibuat:**
  - `web/resources/js/Utils/barcode-generator.js`
  - `chrome-extension/signing/signer.js`
- **Status saat ini:** Selesai (Version Web `web-v1.3.31`, Extension `ext-v1.4.19`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengubah kembali stamp marginal barcode ke mode 1 baris (ketinggian 40px) dan memindahkan kalimat verifikasi "This document has been electronically signed. To Verify visit..." menjadi footer pada setiap halaman PDF melalui `signer.js` di extension menggunakan `pdf-lib`.

- **Tanggal/Waktu:** 2026-06-18T16:07:00Z
- **Tugas yang diselesaikan:** Menyesuaikan style footer verifikasi (CourierBold, rata kanan, warna hijau URL) dan integrasi translasi dinamis dari Web UI
- **File yang diubah/dibuat:**
  - `web/resources/js/Pages/SignDocument.jsx`
  - `chrome-extension/background/service-worker.js`
  - `chrome-extension/signing/signer.js`
- **Status saat ini:** Selesai (Version Web `web-v1.3.32`, Extension `ext-v1.4.21`)
- **Catatan untuk AI selanjutnya (Handoff Note):** Teks footer di PDF telah diatur agar rata kanan. Prefix footer kini mendukung bahasa dinamis (EN/ID/TH) yang dikirimkan via payload dari Web UI. URL kini berwarna hijau.

### [2026-06-19] — Core Bug Fixes & Metadata Enforcement
- **Tugas:** Debugging kegagalan Document Permissions (Sealed) PDF, Sinkronisasi Metadata PDF-lib ke Pikepdf, dan Perbaikan Google Drive Upload (Sanctum/Gdrive Encrypted Cookie issue).
- **File diubah:** 
  - `web/bootstrap/app.php`: Menonaktifkan enkripsi cookie untuk `tsign_api_token` dan `tsign_gdrive_token` agar bisa dibaca oleh extension via `chrome.cookies.get`.
  - `web/app/Http/Controllers/PdfSealController.php` & `web/app/Scripts/seal_pdf.py`: Menyuntikkan langsung `metadata` (Title, Author, Subject, Base URL) ke Python script agar Pikepdf tidak me-reset metadata ke Author "Yoke" atau metadata asli PDF sebelumnya.
  - `chrome-extension/background/service-worker.js`: Meneruskan `metadata` ke `/api/pdf/seal`.
  - Sinkronisasi ulang file ekstensi ke Safari (`safari-extension/Resources/`).
- **Status:** Selesai.
- **Handoff Note:** PDF Sealed sekarang akan secara paksa menimpa metadata sesuai input (Author custom/email, Base URL verify) sebelum dienkripsi AES-256. Masalah upload Visual Signatures ke Google Drive teratasi karena token tidak lagi terenktipsi Laravel secara default. User harus relogin sekali untuk mendapatkan un-encrypted cookie.

### 2026-06-18 — Advanced Options & Sealed PDF Server Implementation
- **Tugas yang diselesaikan:** Implementasi *Advanced Options* (Fitur Lanjutan) termasuk Hide Frame dan penguncian hak akses PDF (Sealed).
- **File yang diubah/dibuat:**
  - `popup.html`, `popup.js`: Menambahkan antarmuka untuk mencentang opsi.
  - `service-worker.js`: Menyisipkan parameter ke ekstensi.
  - `SignDocument.jsx`, `barcode-generator.js`: Menangani mode hide frame dan pengiriman parameter ke Service Worker.
  - `PdfSealController.php` (baru), `api.php`: Backend route untuk proses enkripsi.
  - `seal_pdf.py` (baru): Skrip Python internal server.
  - `Dockerfile`: Update package Python3 + pikepdf.
  - `messages/*.json`: Integrasi bahasa (i18n).
- **Status saat ini:** Selesai (Menunggu User me-rebuild Docker dan Vite).
- **Catatan untuk AI selanjutnya (Handoff Note):** Fungsionalitas sudah selesai. Python + Pikepdf di backend kini melakukan sealing AES-256 dan derivasi sandi pemilik otomatis berdasarkan Token verifikasi dan Serial. Tunggu konfirmasi User telah build ulang container dengan dependency baru tersebut.

### 2026-06-18 — Bugfix PDF Seal Invalid Base64
- **Tugas yang diselesaikan:** Memperbaiki bug "Invalid base64 PDF data" akibat model yang salah di-import (`App\Models\SignedDocument` yang seharusnya `App\Models\Document`) pada `PdfSealController.php`. Selain itu juga menambahkan debug console saat checkbox permission ditekan pada extension `popup.js`.
- **File yang diubah:** `web/app/Http/Controllers/PdfSealController.php`, `chrome-extension/popup/popup.js`
- **Status:** Selesai
- **Handoff Note:** Silakan periksa kembali Sealed PDF Permissions, seharusnya data base64 sudah di-process ke python backend dengan benar.

### 2026-06-18 — Bugfix Pikepdf Permissions
- **Tugas yang diselesaikan:** Memperbaiki bug Python script (seal_pdf.py) yang gagal karena argumen pikepdf yang usang (extract_accessibility diubah menjadi accessibility).
- **File yang diubah:** web/app/Scripts/seal_pdf.py
- **Status:** Selesai

### 2026-06-18 — Update PDF Metadata consistency
- **Tugas yang diselesaikan:** Memperbaiki bug metadata (Title, Author, Subject, dll) yang selalu ter-*reset* atau tertimpa oleh Metadata XMP PDF bawaan yang lama. Kini _pdf-lib_ akan menghapus data XMP lama sehingga memaksa Acrobat membaca data Metadata _Dictionary_ baru yang sudah di-*set* (Title = Nama Asli, Subject = Reason Final, dll). Dan untuk *Producer* telah dikembalikan menggunakan 'TrustlessSign Crypto-Engine (Web3)' sesuai _request_ konsistensi.
- **File yang diubah:** chrome-extension/signing/signer.js, web/app/Scripts/seal_pdf.py
- **Status:** Selesai

### 2026-06-18 — Fix Pikepdf Empty Metadata and Shortcode Base URL
- **Tugas yang diselesaikan:** Memperbaiki Base URL yang kurang /<shortcode> di ujungnya, dan memperbaiki metadata kosong di Acrobat akibat pikepdf `open_metadata()` secara *default* menginjeksi XMP *stream* kosong yang menghapus Info Dictionary dari pdf-lib.
- **File yang diubah:** chrome-extension/signing/signer.js, web/app/Scripts/seal_pdf.py
- **Status:** Selesai

### 2026-06-18 — Fix Double Underscores in Extension Backup Naming
- **Tugas yang diselesaikan:** Memperbaiki bug string filename *backup* di Chrome Extension yang menghasilkan spasi berlebih dan *double underscore* (`__`) akibat membaca `.textContent` yang menyertakan spasi di elemen Skeleton DOM. Semua string spasi telah di-`trim` dan dibersihkan dari *device name* serta *email*.
- **File yang diubah:** chrome-extension/popup/popup.js, chrome-extension/background/service-worker.js
- **Status:** Selesai

### 2026-06-18 — Sync Local Visual Signatures to Drive
- **Tugas yang diselesaikan:** Menambahkan mekanisme sinkronisasi di latar belakang pada fungsi `refreshImageSignatures` untuk mendeteksi *visual signature* di IndexedDB lokal yang belum ter-upload (tidak punya `driveId`) dan langsung meng-upload-nya ke Google Drive jika `gdriveToken` tersedia.
- **File yang diubah:** chrome-extension/popup/popup.js
- **Status:** Selesai

### 2026-06-19 — Extension QR Resize Handle & Footer Fix
- **Tugas yang diselesaikan:**
  1. Menambahkan SE (South-East) resize handle pada kotak drag penempatan visual signature/QR di preview (Chrome & Safari popup.js) sehingga pengguna dapat secara presisi mengatur ukuran QR/Image Signature sebelum mengeksekusi proses Sign Document.
  2. Memperbaiki bug ekstensi gagal menambahkan footer text pada Marginal Page Stamp dengan menambahkan argumen `footerPrefix` dan `verifyUrlShort` ke dalam struktur `SIGN_DOCUMENT` payload.
  3. Menginkremen versi ekstensi (chrome & safari) menjadi `1.6.0` dengan git tag `ext-v1.6.0`.
- **File yang diubah:** `chrome-extension/popup/popup.js`, `safari-extension/Resources/popup.js`, `chrome-extension/package.json`, `chrome-extension/manifest.json`, `safari-extension/Resources/manifest.json`.
- **Status:** Selesai
- **Handoff Note:** Semua request User sudah disinkronisasikan di kedua ekstensi (Chrome/Safari) dan dipush melalui `ext-v1.6.0`. CI/CD pipeline seharusnya sekarang sedang berjalan membangun dan mengirim .crx ke Desktop-PC.

### 2026-06-19 — Bugfix Extension Download Filename, Hide Frame, & Web QR Logo
- **Tugas yang diselesaikan:**
  1. **Extension Filename**: Memperbaiki `chrome.downloads.download` yang mengabaikan nama file untuk URL `data:`. Solusi menggunakan Blob URL (`URL.createObjectURL`).
  2. **Hide Frame**: Menyinkronkan argumen `hideFrame` pada `generateSignatureFrame` dan `generateModernTSignQR` di Chrome/Safari Extension `barcode-generator.js` agar sejajar dengan versi Web. Serta memastikan argumen `optHideFrame` dipassing saat rendering di `popup.js`.
  3. **Web QR Logo**: Memperbaiki masalah logo SVG tidak muncul di tengah QR Code pada Web Dashboard dengan mengonversi `logo-tSign.svg` menjadi Base64 string langsung di dalam `web/resources/js/Utils/barcode-generator.js`.
  4. Bumping versi web ke `1.4.8` dan extension ke `1.6.1`.
- **File yang diubah:**
  - `web/resources/js/Utils/barcode-generator.js`
  - `chrome-extension/popup/popup.js`, `safari-extension/Resources/popup.js`
  - `chrome-extension/signing/barcode-generator.js`, `safari-extension/Resources/signing/barcode-generator.js`
  - `web/package.json`, `chrome-extension/package.json`, `chrome-extension/manifest.json`, `safari-extension/Resources/manifest.json`
- **Status:** Selesai
- **Handoff Note:** Perbaikan telah dicommit dengan tag `ext-v1.6.1` dan `web-v1.4.8`. Tunggu CI/CD ekstensi berjalan ulang ke PC User.
