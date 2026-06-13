# Image Signature Feature - Development Tasks (Trustless Architecture)

**Sprint:** TrustLessSign v1.3.0  
**Epic:** Image-based Signature Support (Zero-Knowledge)  
**Duration:** 2 weeks

---

## Sprint 1: Backend Foundation (ROLLED BACK)
**STATUS:** CANCELLED  
**Reason:** Violates Trustless architecture. Server must not store signatures.

---

## Sprint 2: Extension Storage & UI (COMPLETED)
**STATUS:** DONE (Version 1.3.0)  
**Assigned to:** Frontend/Extension Team

### Task 2.1: Storage Architecture (IndexedDB & Local Processing)
- [x] Create IndexedDB wrapper (`local-db.js`) to locally store visual signatures
- [x] Integrate with existing UI for immediate responsiveness
- [x] Add fallback mechanism to prepare image blobs for future Drive sync during PDF signing

### Task 2.2: Visual Signature Gallery UI
- [x] Integrate a grid layout gallery in `popup.html`
- [x] Add Bio-Digital Minimalism fallback UI for Drive sync failures
- [x] Handle file selection and validation (<25MB, valid image MIME types)
- [x] Synchronize state with `chrome.storage.local` (Default Signature ID)

---

## Sprint 3: PDF Embedding & Barcode Framing (UPCOMING)
**STATUS:** PENDING  
**Assigned to:** Frontend/Extension Team

### Task 3.1: Canvas Barcode Signature Generator
**Files to create:** `extension/signing/barcode-generator.js`
- [ ] Implement silent Identity Provider (IdP) background validation before granting `signerName`.
- [ ] Create function to compose the signature frame using Canvas API.
- [ ] Render background, rounded green border, and checkmark header.
- [ ] Render cursive text (fallback to Google Signin Name) or uploaded image in the center.
- [ ] Inject `JsBarcode` and generate Code 128 Barcode with `shortId`.
- [ ] Add Footer URL (`tsign.vnot.my.id/verify`).
- [x] Implement silent Identity Provider (IdP) background validation before granting `signerName`.
- [x] Create function to compose the signature frame using Canvas API.
- [x] Render background, rounded green border, and checkmark header.
- [x] Render cursive text (fallback to Google Signin Name) or uploaded image in the center.
- [x] Inject `JsBarcode` and generate Code 128 Barcode with `shortId`.
- [x] Add Footer URL (`tsign.vnot.my.id/verify`).
- [x] Implement conditional logic to omit `shortId`, barcode, and footer if framing a QR Code.

### Task 3.2: Image Injection via PDF-Lib
**Files to update:** `extension/signing/signer.js`
- [x] Update `signer.js` to replace direct QR generation with `barcode-generator.js`.
- [x] Modify `popup.js` to call `generateSignatureFrame` instead of generating only QR Base64.
- [x] Test end-to-end embedding process using local storage values.

### Task 3.3: Web Verify Camera Scanner (Headless Mode)
**Files to update:** `web/resources/js/Pages/Verify.jsx`
- [x] Update `VerificationController.php` to accept short ID (`TLS-XXXX`) in addition to full UUID `verify_token`.
- [x] Update `routes/web.php` to allow `/verify` route without token.
- [x] Install `html5-qrcode` in `web/package.json` and build.
- [x] Update `Verify.jsx` to render the custom Scanner UI if `token` is missing.
- [x] Add Manual Short ID Entry UI (EditText + Submit Button).
- [x] Handle Camera Permissions and Error state gracefully.

### Task 3.4: Signing Workflow Harmonization
- [ ] Document the workflow changes in SDP

---

## Sprint 4: Testing & Polish (UPCOMING)

### Task 4.1: Quality Assurance
- [ ] E2E Testing: Complete signing flow with visual image
- [ ] Verify aspect ratio preservation across different PDF sizes
- [ ] Validate Safari and Chrome functional parity
