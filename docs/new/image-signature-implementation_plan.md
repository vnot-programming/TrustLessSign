# Image Signature Feature - Implementation Plan (Zero-Knowledge / Trustless)

**Version:** 1.3.0  
**Date:** 2026-06-13  
**Status:** In Progress (Sprint 2 Completed)  
**Feature:** Image-based Signature Upload and Embedding (Trustless Architecture)

---

## 1. Overview

### 1.1 Objective
Implement functionality to allow users to upload image-based visual signatures (scanned wet signatures, signature pads, or drawn signatures) and embed them into PDF documents alongside cryptographic signatures, strictly adhering to the Zero-Knowledge principle where the server never touches the image.

### 1.2 Trustless Philosophy
Unlike traditional Web2 systems, TrustLessSign does not store user data. The image signature processing, resizing, and storage must occur entirely on the client-side (Chrome/Safari Extension) and within the user's private Google Drive (`TrustLessSign/ImageSignatures` directory). The Laravel backend is completely bypassed.

---

## 2. Technical Requirements

### 2.1 Supported Image Formats
- **PNG** (preferred - supports transparency)
- **JPG/JPEG**
- **WebP**

### 2.2 Image Specifications
- **Max File Size:** 25 MB
- **Local Validation:** MIME types and sizes are checked locally via FileReader API before uploading.

### 2.3 Storage Architecture (Zero-Trust & IndexedDB)
- The extension captures and stores visual signatures instantly in the browser's **IndexedDB** (`local-db.js`) to prevent UI flickering.
- Images are only synchronized to the user's private Google Drive (`TrustLessSign/ImageSignatures`) via `gdrive.js` during the actual PDF signing execution or background sync.
- Default signature ID is stored in `chrome.storage.local`.
- No database tables or backend API endpoints are ever used for image storage or processing.

---

## 3. Architecture & Design

### 3.1 Component Overview

```
┌──────────────────────────────────────────────────┐
│             Chrome / Safari Extension            │
│                                                  │
│  ┌────────────────┐       ┌───────────────────┐  │
│  │ Image Uploader │       │ PDF Processing    │  │
│  │ (Local Canvas) │──────>│ (pdf-lib.js)      │  │
│  └────────────────┘       └───────────────────┘  │
│          │                          │            │
│          ↓                          │            │
│  ┌────────────────────────┐         │            │
│  │     IndexedDB          │         │            │
│  │   (local-db.js)        │         │            │
│  └────────────────────────┘         │            │
│          │                          │            │
│          ↓                          ↓            │
│  ┌────────────────────────────────────────────┐  │
│  │               gdrive.js                    │  │
│  │ (Google Drive API Integration)             │  │
│  └────────────────────────────────────────────┘  │
└───────────────────────┬──────────────────────────┘
                        │
                        ↓
             ┌─────────────────────┐
             │    User's Private   │
             │     Google Drive    │
             └─────────────────────┘
```

### 3.2 Security Considerations
- **No Backend Exposure:** Images never traverse the TrustLessSign Laravel server.
- **Client-Side Validation:** Extension explicitly restricts inputs to `image/png, image/jpeg, image/webp` and `< 25MB`.
- **Decentralized Storage:** Users retain full control over their visual signatures in their own Drive.

---

## 4. Implementation Steps

### Phase 1: Backend Foundation (CANCELLED / ROLLED BACK)
*Note: This phase was initially planned but completely rolled back to enforce the Zero-Knowledge protocol.*

### Phase 2: Extension Storage & UI (COMPLETED)
- [x] Create Local Database wrapper (`local-db.js`) using IndexedDB for instant UI response without flicker.
- [x] Create Visual Signatures Gallery in the "Keys & Cert" tab
- [x] Support marking signatures as default and store state in `chrome.storage.local`
- [x] Apply Bio-Digital Minimalism aesthetic (Custom modales, Fallbacks, CSS)

### Phase 3: PDF Embedding & Barcode Signature Framing (Next)
- [ ] Implement Canvas API generator (`barcode-generator.js`) to compose the TrustLessSign Signature Frame.
- [ ] Inject JsBarcode library for 1D Code 128 generation.
- [ ] Implement silent Zero-Trust Authentication validation before rendering `signerName` to ensure cryptographic validity.
- [ ] Render static elements: White background, 24px padding, thick green left border with rounded corners.
- [ ] Render Header: Green check icon + "Signed by: [signerName]".
- [ ] Render Body: Embed the user's uploaded image (or cursive text). If using QR Code, embed the QR Code instead.
- [ ] Render Meta & Barcode: Add "TrustLessSign Zero Trust", `shortId` (e.g., TLS-XXXX), Code 128 Barcode, and Footer URL. (Note: Omit `shortId`, Barcode, and Footer URL if wrapping a QR Code).
- [ ] Convert the composed Canvas into an image buffer.
- [ ] Read image buffer from Google Drive / IndexedDB during the signing process.
- [ ] Integrate `pdf-lib` to embed the composed Canvas image onto the PDF canvas.
- [ ] Tie image selection to the existing drag-and-drop selector using a Ghost Element or 50ms Debounce to prevent memory leak during live preview simulation.

### Phase 4: Web Verify Scanner Integration
- [ ] Update `web/resources/js/Pages/Verify.jsx` to include an EditText for manual Short ID entry.
- [ ] Integrate `html5-qrcode` library in **Headless Mode** (`Html5Qrcode` class) without the built-in scanner UI.
- [ ] Build custom scanner UI: target box, animated green scanning line, blurred background outside the target, and camera switch button.
- [ ] Implement Responsive Video & Camera Selection logic:
  - Set dynamic `aspectRatio` (1.33 or 1.77 for PC/Landscape; auto/vertical for Mobile).
  - Use `{ facingMode: "environment" }` by default to prioritize the rear camera.
  - Use `Html5Qrcode.getCameras()` to allow users to switch cameras if needed.
- [ ] Implement graceful Error Handling for `NotAllowedError` and `NotReadableError` (Show interactive warning guiding to Manual Input).
- [ ] Map the scanned `shortId` to the document's verification API. (API returns metadata and document_hash ONLY, strictly Zero Trust).

### Phase 5: Testing & Polish
- [ ] Test upload quotas and Drive synchronization.
- [ ] Test cross-browser compatibility (Safari vs Chrome) for Canvas generation and Camera access.
- [ ] End-to-end PDF signing with both visual Canvas frame and cryptographic stamps.
