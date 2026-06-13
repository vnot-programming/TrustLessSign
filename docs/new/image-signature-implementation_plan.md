# Image Signature Feature - Implementation Plan

**Version:** 1.0.0  
**Date:** 2026-06-13  
**Status:** Planning  
**Feature:** Image-based Signature Upload and Embedding

---

## 1. Overview

### 1.1 Objective
Implement functionality to allow users to upload image-based signatures (scanned wet signatures, signature pads, or drawn signatures) and embed them into PDF documents alongside cryptographic signatures.

### 1.2 Business Value
- Enhanced user experience with familiar signature methods
- Support for users who prefer visual signatures
- Maintain legal compliance while improving usability
- Bridge between traditional and digital signing workflows

### 1.3 Target Users
- Users with existing wet signatures
- Organizations requiring visual signature appearance
- Users with signature pads or stylus devices
- Mobile users drawing signatures with touch

---

## 2. Technical Requirements

### 2.1 Supported Image Formats
- **PNG** (preferred - supports transparency)
- **JPG/JPEG** (fallback - no transparency)
- **WebP** (modern browsers)
- **SVG** (vector signatures - future consideration)

### 2.2 Image Specifications
- **Max File Size:** 5 MB
- **Max Dimensions:** 2000 x 1000 px
- **Min Dimensions:** 100 x 50 px
- **Recommended Aspect Ratio:** 3:1 to 5:1 (width:height)
- **Color Mode:** RGB or Grayscale
- **Transparency:** Supported for PNG

### 2.3 Security Requirements
- Image sanitization to prevent malicious files
- MIME type validation (not just extension)
- File size enforcement
- Malware scanning integration (ClamAV or similar)
- No executable content in images
- Strip EXIF metadata for privacy

### 2.4 Storage Requirements
- Store original uploaded image
- Generate optimized version for embedding
- Store metadata (upload date, file hash, dimensions)
- Link to user account
- Implement cleanup for unused images (>90 days)

---

## 3. Architecture & Design

### 3.1 Component Overview

```
┌─────────────────────┐
│   Chrome Extension  │
│                     │
│ ┌─────────────────┐ │
│ │ Image Uploader  │ │
│ │ Component       │ │
│ └─────────────────┘ │
│         │           │
│         ↓           │
│ ┌─────────────────┐ │
│ │ Image Processor │ │
│ │ (Validation)    │ │
│ └─────────────────┘ │
└──────────┬──────────┘
           │
           ↓
┌──────────────────────┐
│   Laravel Backend    │
│                      │
│ ┌──────────────────┐ │
│ │ Image Upload API │ │
│ └──────────────────┘ │
│          │           │
│          ↓           │
│ ┌──────────────────┐ │
│ │ Image Service    │ │
│ │ - Validation     │ │
│ │ - Sanitization   │ │
│ │ - Optimization   │ │
│ └──────────────────┘ │
│          │           │
│          ↓           │
│ ┌──────────────────┐ │
│ │ Storage Service  │ │
│ │ (S3/Local)       │ │
│ └──────────────────┘ │
│          │           │
│          ↓           │
│ ┌──────────────────┐ │
│ │   Database       │ │
│ │ (user_signatures)│ │
│ └──────────────────┘ │
└──────────────────────┘
           │
           ↓
┌──────────────────────┐
│   PDF Processing     │
│                      │
│ ┌──────────────────┐ │
│ │ PDF-lib.js       │ │
│ │ Image Embedding  │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### 3.2 Database Schema

```sql
CREATE TABLE user_signatures (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    signature_name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    optimized_path VARCHAR(500),
    mime_type VARCHAR(50) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    width INT UNSIGNED NOT NULL,
    height INT UNSIGNED NOT NULL,
    file_hash VARCHAR(64) NOT NULL UNIQUE,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_file_hash (file_hash)
);

ALTER TABLE documents ADD COLUMN signature_image_id BIGINT UNSIGNED NULL AFTER signature_data;
ALTER TABLE documents ADD FOREIGN KEY (signature_image_id) REFERENCES user_signatures(id) ON DELETE SET NULL;
```

### 3.3 API Endpoints

**Upload Signature:**
```
POST /api/v1/signatures/upload
Content-Type: multipart/form-data

Response (201):
{
  "success": true,
  "data": {
    "id": 123,
    "signature_name": "My Signature",
    "thumbnail_url": "https://...",
    "is_default": true
  }
}
```

**List Signatures:**
```
GET /api/v1/signatures
DELETE /api/v1/signatures/{id}
POST /api/v1/signatures/{id}/set-default
```

---

## 4. Implementation Steps

### Phase 1: Backend Foundation (Week 1)

- [ ] Create `user_signatures` table migration
- [ ] Create `ImageSignature` model
- [ ] Implement `ImageSignatureService` class
- [ ] Create API controllers and routes
- [ ] Add validation and security checks
- [ ] Configure storage for signatures
- [ ] Implement cleanup scheduler

### Phase 2: Chrome Extension (Week 2)

- [ ] Create signature upload modal UI
- [ ] Implement drag-and-drop upload
- [ ] Add image preview and cropping
- [ ] Create signature gallery component
- [ ] Integrate with signing flow
- [ ] Add position selector on PDF

### Phase 3: PDF Embedding (Week 3)

- [ ] Integrate pdf-lib image embedding
- [ ] Handle PNG transparency
- [ ] Implement scaling and positioning
- [ ] Add signature metadata to PDF
- [ ] Create visual appearance options
- [ ] Support custom templates

### Phase 4: Testing (Week 4)

- [ ] Unit tests for backend services
- [ ] Integration tests for upload flow
- [ ] E2E tests for complete signing
- [ ] Performance testing
- [ ] Security testing
- [ ] Load testing

---

## 5. Security Considerations

- **File Validation:** Check MIME type and magic bytes
- **Size Limits:** Max 5MB per upload
- **Rate Limiting:** 10 uploads/hour per user
- **EXIF Stripping:** Remove all metadata
- **Access Control:** User-specific directories
- **Signed URLs:** Temporary access only

---

## 6. Success Metrics

- Upload success rate: >99%
- Average upload time: <3 seconds
- User adoption: >40% within 3 months
- Storage per user: <10 MB average
- Support tickets: <5% increase

---

**Document Status:** Ready for implementation