# Software Design Document (SDD) - TrustlessSign

## 1. System Architecture
TrustlessSign is structured as a standalone monolith combining a Laravel 13 backend (API + Inertia views) and a client-side Chrome Extension (Manifest V3).

```
   ┌─────────────────────────────────────────────────────────┐
   │                  Chrome Extension (MV3)                  │
   │  - Key Generation (Web Crypto API)                      │
   │  - Local PDF Signer (pdf-lib, node-forge)               │
   │  - Google Drive Client (GDrive API v3)                  │
   └────────────┬────────────────────────────────┬───────────┘
                │ Auth & Cert Issue              │ Signed Metadata
                ▼                                ▼
   ┌─────────────────────────────────────────────────────────┐
   │               Laravel Monolith (Host: 8101)             │
   │  - Private Certificate Authority (PHP OpenSSL)          │
   │  - Relational Schema (PostgreSQL)                        │
   │  - Inertia.js + React 19 Dashboard views                │
   └─────────────────────────────────────────────────────────┘
```

## 2. Relational Database Schema
- **`users`**: Manages OAuth identities (Google, Facebook, Line) and credentials.
- **`certificates`**: Public certs mapped to users (X.509 PEM format).
- **`reason_categories`** & **`reason_sub_categories`**: Administrative reason choices.
- **`documents`**: Public verification mappings containing the file hash and Google Drive URL.

## 3. Cryptographic Specs & CA Flow
1. **Root CA Generation**:
   - RSA-2048 keys generated at CA bootstrap via OpenSSL in `CAManager.php`.
   - Root Certificate self-signed with a 10-year validity.
2. **User Certificate Issuance**:
   - Client generates an RSA-2048 keypair, constructs a CSR locally, and POSTs to `/api/certificates/issue`.
   - CA signs the CSR, returns the X.509 client certificate, and saves public cert details.
3. **Local Encryption**:
   - User private keys are encrypted in browser local storage (`chrome.storage.local`) using AES-256-GCM derived from the user's Master Password.
