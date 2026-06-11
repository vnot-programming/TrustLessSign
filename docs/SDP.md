# Software Development Plan (SDP)
## Project: TrustlessSign
## Current State / Log Progress

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
  - **Catatan untuk AI selanjutnya (Handoff Note)**: Proyek siap dipindahkan dari temporary disk ke lokasi persisten (`/home/vnot/docker`) setelah pengguna mengonfirmasi persetujuan akhir. Semuanya sudah diuji dan berjalan normal.
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
- **File yang diubah/dibuat:** `.github/workflows/deploy.yml`
- **Status saat ini:** Selesai
- **Catatan untuk AI selanjutnya (Handoff Note):** Mengubah GitHub Actions agar mendukung Monorepo *Versioning*. Trigger sekarang berdasarkan `tags: web-v*` atau `ext-v*`. Proses `deploy_web` dan `deploy_extension` berjalan terpisah dengan pengecekan kondisional (`startsWith`) untuk menghindari eksekusi serentak yang tumpang tindih. Ekstensi tidak lagi me-reset *cache* Laravel, dan Web tidak lagi memicu kompresi `.crx`.
