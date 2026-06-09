# Software Requirements and Design (SRD) - Interface Specs

## 1. REST API Specification

### Public Endpoints (Rate Limited: 60/min)
*   **`GET /api/pki/root-cert`**
    *   Description: Downloads the Root CA certificate (`root_ca.crt`).
    *   Response: File stream (`application/x-x509-ca-cert`).

*   **`GET /api/verify/{token}`**
    *   Description: Retrieves metadata for the verification landing page.
    *   Response:
        ```json
        {
          "signer_name": "John Doe",
          "doc_hash_sha256": "abcdef...",
          "gdrive_url_signed": "https://drive.google.com/file/d/...",
          "signed_at": "2026-06-09T17:30:00Z",
          "reason_final": "Approved: Authorized Sign-off",
          "cert_status": "VALID"
        }
        ```

### Extension Endpoints (Sanctum Authenticated)
*   **`POST /api/certificates/issue`**
    *   Request Body:
        ```json
        {
          "csr": "-----BEGIN CERTIFICATE REQUEST-----\n..."
        }
        ```
    *   Response:
        ```json
        {
          "certificate": "-----BEGIN CERTIFICATE-----\n...",
          "serial_number": "12345678"
        }
        ```

*   **`POST /api/documents/register`**
    *   Request Body:
        ```json
        {
          "verify_token": "token123",
          "gdrive_url_signed": "https://drive.google.com/file/...",
          "original_filename": "doc.pdf",
          "doc_hash_sha256": "abcdef...",
          "reason_sub_cat_id": 1,
          "reason_final": "Custom note summary",
          "qr_position": { "page": 1, "x": 100, "y": 150, "size": 80 }
        }
        ```
    *   Response:
        ```json
        {
          "status": "success",
          "message": "Document registered successfully"
        }
        ```

## 2. Dynamic Language Settings Configuration
- Configuration source: `resources/js/Components/LanguageSwitcher.jsx`
- Translation source: `resources/messages/{locale}.json`
- UI Routing uses Laravel state share (`HandleInertiaRequests.php`).
