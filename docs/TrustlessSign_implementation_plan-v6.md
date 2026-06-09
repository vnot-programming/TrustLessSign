# Implementation Plan - Chrome Extension & Web Dashboard Integration for TrustlessSign

This document outlines the detailed technical plan to integrate the Chrome Extension (Manifest V3) and the Laravel 13 React Web Dashboard for TrustlessSign.

## User Review Required

> [!WARNING]
> **Certificate Replacement Warning Modal**:
> A user can have only **1 active certificate** at a time. Replacing it automatically revokes the old one, making all previously signed documents **invalid (status: SERTIFIKAT DICABUT)**.
> - We will add a confirmation modal requiring the user to type **"SAYA MENGERTI"** to proceed with key replacement on the dashboard.
> - The buttons will be styled and labeled exactly as:
>   - **`[ BATAL ]`** (cancel action)
>   - **`[[ YA, REPLACE SERTIFIKAT ]]`** (confirm action, disabled until "SAYA MENGERTI" is typed).
> - The database will mark the old certificate as `is_revoked = true` with reason `'Replaced by user'`.

> [!IMPORTANT]
> **Dynamic Visual Progress UI/UX (Skenario A & Skenario B)**:
> Both the Standalone Extension and Web Dashboard will use an identical progress display component and state management strategy to maintain brand consistency:
> ```
> +-----------------------------------------------------------------------+
> | Memproses Dokumen Berkas...                                           |
> |                                                                       |
> | [=======================================------------] 65%             |
> |                                                                       |
> | Detail Status:                                                        |
> | ✔️ Membaca berkas asli dari Google Drive                              |
> | ⏳ Menyisipkan tanda tangan kriptografi & QR Code                     |
> | 🔄 Mengunggah dokumen ter-stamp kembali ke Google Drive (65%)         |
> +-----------------------------------------------------------------------+
> ```
> - **React State Management Structure**:
>   ```typescript
>   const [signingStatus, setSigningStatus] = useState<{
>     isActive: boolean;
>     stage: 'IDLE' | 'DOWNLOADING' | 'STAMPING' | 'UPLOADING' | 'SUCCESS' | 'ERROR';
>     percentage: number;
>     message: string;
>   }>({
>     isActive: false,
>     stage: 'IDLE',
>     percentage: 0,
>     message: ''
>   });
>   ```
> - **Dynamic Phase Progression**:
>   - **Fase 1: Penarikan Berkas (Membaca dari Google Drive)**
>     - Progress: 0% - 30% (slow movement/pulse)
>     - Status Text: "Menghubungi Google Drive... Mengunduh dokumen asli ke memori lokal."
>   - **Fase 2: Pemrosesan Kriptografi (Lokal di Komputer User)**
>     - Progress: 31% - 50% (rapid jump)
>     - Status Text: "Menghitung hash dokumen... Menyisipkan QR Code dan menyegel tanda tangan RSA-2048."
>   - **Fase 3: Pengunggahan Berkas (Kembali ke Google Drive)**
>     - Progress: 51% - 99% (based on byte upload progress)
>     - Status Text: "Mengunggah dokumen aman kembali ke Google Drive Anda... [X] MB terkirim."
>   - **Fase 4: Finalisasi (Sinkronisasi ke Server Laravel)**
>     - Progress: 100% (progress bar color changes from blue to green)
>     - Status Text: "Sukses! Mencatat URL dokumen ter-stamp ke server TrustlessSign."

---

## Proposed Changes

We will implement the changes across both components (Web Dashboard and Chrome Extension) to achieve the desired features.

### [Component 1] Web Dashboard (Laravel 13 & React 19)

#### [MODIFY] [Dashboard.jsx](file:///home/vnot/extra_disk/docker-temp/trustlesssign/resources/js/Pages/Dashboard.jsx)
- Fetch the user's certificate status on load.
- If **No Certificate**: Show green **"Generate Certificate"** button.
- If **Active Certificate Exists**: Show yellow/red **"Re-generate / Replace Certificate"** button.
- Clicking the replacement button opens the **Critical Security Warning Modal** requiring typing **"SAYA MENGERTI"** and displaying the buttons:
  - **`[ BATAL ]`**
  - **`[[ YA, REPLACE SERTIFIKAT ]]`**

#### [MODIFY] [app/Http/Controllers/CertificateController.php](file:///home/vnot/extra_disk/docker-temp/trustlesssign/app/Http/Controllers/CertificateController.php)
- Update the `issue` method: if the user has an existing active certificate, revoke it automatically (set `is_revoked = true`, `revoked_at = now()`, `revoke_reason = 'Replaced by user'`) and allow issuing the new one instead of failing.

#### [MODIFY] [SocialiteController.php](file:///home/vnot/extra_disk/docker-temp/trustlesssign/app/Http/Controllers/SocialiteController.php) & [AuthController.php](file:///home/vnot/extra_disk/docker-temp/trustlesssign/app/Http/Controllers/AuthController.php)
- Save the Google Access Token returned during Google OAuth login into the user's `gdrive_token` field in the database.

#### [NEW] [routes/web.php](file:///home/vnot/extra_disk/docker-temp/trustlesssign/routes/web.php)
- Add a new route `GET /user/credentials` under `auth:sanctum` which returns the user's Google Drive token and Sanctum Token for authentication from the extension.

---

### [Component 2] Chrome Extension (Manifest V3)

#### [MODIFY] [manifest.json](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/manifest.json)
- Add the `"windows"` permission to support popout window creation.
- Add `"content_scripts"` referencing `content.js` to enable web-extension communication if needed.

#### [NEW] [content.js](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/content.js)
- Inject `window.__TRUSTLESS_SIGN_EXTENSION_INSTALLED__ = true` into the page context.
- Listen for window events to bridge messages to the background script.

#### [NEW] [background/service-worker.js](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/background/service-worker.js)
- Implement Service Worker using `importScripts` for `forge.min.js` and `pdf-lib.min.js`.
- Listen for popup or content script messages.
- Manage X.509 Certificate issuance via `/api/certificates/issue` CSR exchange.
- Provide background helper functions for local PDF hashing, RSA signing, QR code embedding, and uploading to Google Drive via GDrive API v3.
- Handle GDrive file permission sharing (`anyone` as `reader`).

#### [MODIFY] [popup.html](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/popup/popup.html) & [popup.js](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/popup/popup.js)
- Add a **"Pop out" button** in the corner to trigger window popout.
- implement `chrome.windows.create()` popup creation, centering, and closing the initial small popup.
- Integrate the design elements matching the Bio-Digital Minimalism HSL tokens from `app.css`.
- Add PDF loading, QR code coordinate scaling/placement (using a responsive canvas preview), signing reason selection (Category/Subcategory dropdowns), and Master Password verification.
- Show an internal file upload progress bar using XHR/Fetch tracking.

---

### [Component 3] Vendor Assets

#### [NEW] [assets/forge.min.js](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/assets/forge.min.js)
- Fetch and place `node-forge` library in extension folder.

#### [NEW] [assets/pdf-lib.min.js](file:///home/vnot/extra_disk/docker-temp/trustlesssign/chrome-extension/assets/pdf-lib.min.js)
- Fetch and place `pdf-lib` library in extension folder.

#### [NEW] [resources/js/Utils/qrious.min.js](file:///home/vnot/extra_disk/docker-temp/trustlesssign/resources/js/Utils/qrious.min.js)
- Place `qrious` library in the web project to render QR code images offline.

---

## Verification Plan

### Automated Tests
- Run `php artisan test tests/Feature/TrustlessSignApiTest.php` to ensure the API behaves correctly on certificate issuance and revocation.

### Manual Verification
1. **Warning Modal**: Click "Replace Certificate" on the dashboard, check that the modal shows, and verify that the confirmation button is disabled until typing "SAYA MENGERTI".
2. **Popout window**: Click "Pop out" on the extension, verify it opens in a centered standalone window without an address bar.
3. **Signing**: Upload a PDF within the extension popup, place the QR code, fill out the reason inputs, and sign. Verify that the file is uploaded to Google Drive, shared publicly, and registered with the database successfully.
4. **Verification**: Access the public landing page via the verify URL, verify that the page downloads the PDF and performs the hash check successfully. If the certificate was replaced, verify it shows "SERTIFIKAT DICABUT".
