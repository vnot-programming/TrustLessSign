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

