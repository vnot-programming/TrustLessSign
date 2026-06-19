# Image Signature Feature - Implementation Plan (Zero-Knowledge / Trustless)

**Version:** 1.3.0  
**Date:** 2026-06-13  
**Status:** Completed (Sprints 1-4 Done)  
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

### Phase 3: Signature Type Selector & Dynamic Drag Box Integration (Next)
- [x] **Extension Popup UI**:
  - Add a "Signature Type" selector (QR Code vs Image Signature) above the PDF preview container.
  - If "Image Signature" is selected but none exists, prompt the user to upload one and redirect them to the "Keys & Cert" tab.
  - Dynamically update the `qr-drag-box` content: If "Image Signature" is selected, render a miniature preview of the default image signature inside the drag box instead of the "QR Code" text.
- [x] **Web Dashboard UI (`SignDocument.jsx`)**:
  - Implement a Cross-Origin messaging bridge to fetch the default Image Signature from the Extension's IndexedDB.
  - Add a "Signature Type" dropdown/selector (QR Code vs Visual Signature).
  - Provide fallback logic: If extension is installed but no visual signature is found, show an alert directing the user to the extension to upload one.
  - Update `Draggable` node: Use a React state to dynamically switch the box content between "QR Code Area" text and a visual `<img src={...} />` preview of the selected visual signature.
- [x] **Canvas Rendering & PDF Lib (`barcode-generator.js`)**:
  - Implement Canvas API generator to compose the final visual frame (green border, check icon, "Signed by: [Name]").
  - Embed the chosen element (QR code data OR visual signature image) into the center of the Canvas.
  - Include the Barcode 128 (Short ID) ONLY on Image Signature (omit for QR Code).
  - Embed the composed Canvas output onto the PDF via `pdf-lib` at the exact coordinates recorded by the `qr-drag-box`.
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
