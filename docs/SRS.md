# Software Requirements Specification (SRS) - TrustlessSign

## 1. Introduction
TrustlessSign is a decentralized, zero-trust digital signature application. Its purpose is to sign and verify administrative PDF files using a Private Certificate Authority (CA) system without exposing the user's private cryptographic keys or the PDF content to the server.

## 2. Core Functional Requirements
1. **Zero-Trust Private Key Generation & Custody**:
   - The user's RSA-2048 private key must be generated locally in the browser/extension.
   - The private key must *never* leave the local device.
   - The private key must be saved in `chrome.storage.local` encrypted using AES-256-GCM via a Master Password.
2. **Offline PDF Signature Generation**:
   - PDF signing must happen client-side using `pdf-lib` and `node-forge`.
   - The extension downloads the target PDF from Google Drive, computes the SHA-256 hash, signs the hash using the local private key, and embeds the signature block along with the X.509 certificate chain.
3. **Google Drive Integration**:
   - The signed PDF must be uploaded back to the user's Google Drive via the Google Drive API.
   - The backend server only stores the document's metadata (URL, file name, signed SHA-256 hash, verify token, signature position).
4. **Public Verification**:
   - Scan of the embedded QR Code redirects to `https://tsign.vnot.my.id/verify/{token}`.
   - The public verification landing page retrieves the metadata from the server, downloads the signed PDF directly from the Google Drive URL, computes the hash locally, and verifies the file integrity and certificate chain.
5. **Private CA Hierarchy**:
   - The backend Laravel service operates a Private CA using Native PHP OpenSSL (RSA-2048).
   - Generates and signs user certificates (X.509) dynamically based on CSRs sent from the client extension.
6. **Multi-language Support (i18n)**:
   - The interface must support English (`en`), Indonesian (`id`), and Thai (`th`) dynamically.

## 3. Non-Functional & Security Requirements
1. **Privacy**: Zero document body content transmitted to the application server.
2. **Accessibility (A11y)**: Focus rings on all inputs, multi-visual indicators (never rely on color alone for errors), HSL theme configuration, and readable typography.
3. **Performance**: Asset caching, fast native JS crypto operations, and lightweight loading.
