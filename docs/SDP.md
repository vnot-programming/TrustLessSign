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
