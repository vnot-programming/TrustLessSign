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
- **Max File Size:** 5 MB
- **Local Validation:** MIME types and sizes are checked locally via FileReader API before uploading.

### 2.3 Storage Architecture (Google Drive API)
- The extension authenticates with Google Drive using the existing `gdriveToken`.
- Signatures are stored in `TrustLessSign/ImageSignatures`.
- Default signature ID is stored in `chrome.storage.local`.
- No database tables or backend API endpoints are used for images.

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
- **Client-Side Validation:** Extension explicitly restricts inputs to `image/png, image/jpeg, image/webp` and `< 5MB`.
- **Decentralized Storage:** Users retain full control over their visual signatures in their own Drive.

---

## 4. Implementation Steps

### Phase 1: Backend Foundation (CANCELLED / ROLLED BACK)
*Note: This phase was initially planned but completely rolled back to enforce the Zero-Knowledge protocol.*

### Phase 2: Extension Storage & UI (COMPLETED)
- [x] Implement Google Drive API for direct uploads (`gdrive.js`)
- [x] Create Visual Signatures Gallery in the "Keys & Cert" tab
- [x] Support marking signatures as default
- [x] Apply Bio-Digital Minimalism aesthetic (Custom modales, Fallbacks, CSS)

### Phase 3: PDF Embedding (Next)
- [ ] Read image buffer from Google Drive directly during the signing process
- [ ] Integrate `pdf-lib` to embed the PNG/JPG onto the PDF canvas
- [ ] Tie image selection to the existing QR drag-and-drop selector
- [ ] Maintain aspect ratio and visual fidelity

### Phase 4: Testing & Polish
- [ ] Test upload quotas and Drive synchronization
- [ ] Test cross-browser compatibility (Safari vs Chrome)
- [ ] End-to-end PDF signing with both visual and cryptographic stamps
