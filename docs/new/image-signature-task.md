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

### Task 2.1: Google Drive Integration
- [x] Extend `gdrive.js` to support image uploads
- [x] Create folder structure logic (`TrustLessSign/ImageSignatures`)
- [x] Add fetching and deletion endpoints interacting strictly with Google Drive API

### Task 2.2: Visual Signature Gallery UI
- [x] Integrate a grid layout gallery in `popup.html`
- [x] Add Bio-Digital Minimalism fallback UI for Drive sync failures
- [x] Handle file selection and validation (<5MB, valid image MIME types)
- [x] Synchronize state with `chrome.storage.local` (Default Signature ID)

---

## Sprint 3: PDF Embedding (UPCOMING)
**STATUS:** PENDING  
**Assigned to:** Frontend/Extension Team

### Task 3.1: Image Injection via PDF-Lib
**Files to update:** `extension/signing/signer.js`
- [ ] Add checkbox "Use Visual Signature" to the signing tab UI
- [ ] When enabled, download the default image blob from Google Drive
- [ ] Parse image (PNG/JPG) using `pdf-lib`
- [ ] Map the coordinates from the drag-and-drop selector to draw the image

### Task 3.2: Signing Workflow Harmonization
- [ ] Ensure visual signature doesn't break or alter the cryptographic hash footprint logic
- [ ] Add error handling if Google Drive fails to download the image during signing
- [ ] Document the workflow changes in SDP

---

## Sprint 4: Testing & Polish (UPCOMING)

### Task 4.1: Quality Assurance
- [ ] E2E Testing: Complete signing flow with visual image
- [ ] Verify aspect ratio preservation across different PDF sizes
- [ ] Validate Safari and Chrome functional parity
