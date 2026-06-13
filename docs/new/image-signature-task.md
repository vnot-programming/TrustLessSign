# Image Signature Feature - Development Tasks

**Sprint:** TrustLessSign v1.3.0  
**Epic:** Image-based Signature Support  
**Story Points:** 21  
**Duration:** 4 weeks

---

## Sprint 1: Backend Foundation (Week 1) - 8 Points

### Task 1.1: Database Schema
**Points:** 2  
**Assigned to:** Backend Team

- [ ] Create migration for `user_signatures` table
- [ ] Add columns: id, user_id, signature_name, file_path, optimized_path, mime_type, file_size, width, height, file_hash, is_default, metadata
- [ ] Add foreign key to users table with CASCADE delete
- [ ] Create indexes on user_id, file_hash
- [ ] Alter documents table: add `signature_image_id` column
- [ ] Add foreign key from documents to user_signatures

**Acceptance Criteria:**
- Migration runs successfully
- All indexes created
- Foreign keys working correctly
- Rollback tested

---

### Task 1.2: Laravel Model & Service
**Points:** 3  
**Assigned to:** Backend Team

**Files to create:**
- `app/Models/ImageSignature.php`
- `app/Services/ImageSignatureService.php`
- `app/Http/Requests/UploadSignatureRequest.php`

**ImageSignature Model:**
- [ ] Define fillable fields
- [ ] Add relationship to User model
- [ ] Add relationship to Document model
- [ ] Implement file path accessor for URLs
- [ ] Add is_default scope

**ImageSignatureService:**
- [ ] `upload(UploadedFile $file, User $user, ?string $name)` method
- [ ] `validateMimeType()` - check magic bytes
- [ ] `sanitizeImage()` - strip EXIF, validate dimensions
- [ ] `optimizeImage()` - create 600x200px version
- [ ] `storeImage()` - save to storage with user folder structure
- [ ] `calculateHash()` - SHA256 of file content
- [ ] `delete(ImageSignature $signature)` method

**Acceptance Criteria:**
- Unit tests pass (>80% coverage)
- Handles PNG, JPG, WebP
- Rejects files >5MB
- Strips EXIF data
- Generates optimized version

---

### Task 1.3: API Endpoints
**Points:** 2  
**Assigned to:** Backend Team

**Files to create:**
- `app/Http/Controllers/Api/SignatureController.php`
- `routes/api.php` (update)

**Endpoints:**
```
POST   /api/v1/signatures/upload
GET    /api/v1/signatures
GET    /api/v1/signatures/{id}
DELETE /api/v1/signatures/{id}
POST   /api/v1/signatures/{id}/set-default
```

**Implementation:**
- [ ] Upload endpoint with multipart/form-data
- [ ] Return thumbnail URL (signed S3 URL or public path)
- [ ] List endpoint with pagination
- [ ] Delete endpoint with permission check
- [ ] Set default endpoint (unset others first)

**Acceptance Criteria:**
- All endpoints return proper JSON responses
- Authentication required
- User can only access their own signatures
- Rate limiting: 10 uploads/hour
- API tests pass

---

### Task 1.4: Storage Configuration
**Points:** 1  
**Assigned to:** DevOps/Backend

- [ ] Configure S3 bucket for signatures (or local filesystem)
- [ ] Set up folder structure: `signatures/{user_id}/{filename}`
- [ ] Configure CORS for Chrome extension access
- [ ] Set up signed URL generation (15 min expiry)
- [ ] Implement cleanup job for unused signatures (>90 days)

**Acceptance Criteria:**
- Files upload successfully
- Signed URLs work from extension
- Cleanup job scheduled (daily)

---

## Sprint 2: Chrome Extension UI (Week 2) - 5 Points

### Task 2.1: Upload Modal Component
**Points:** 2  
**Assigned to:** Frontend Team

**Files to create:**
- `extension/src/components/SignatureUploadModal.tsx`
- `extension/src/hooks/useSignatureUpload.ts`

**Features:**
- [ ] Drag-and-drop upload area
- [ ] File picker button
- [ ] Image preview after selection
- [ ] Signature name input
- [ ] Upload progress bar
- [ ] Error handling and display

**Acceptance Criteria:**
- Validates file type before upload
- Shows preview before submission
- Displays upload progress
- Error messages are clear
- Mobile responsive

---

### Task 2.2: Signature Gallery
**Points:** 2  
**Assigned to:** Frontend Team

**Files to create:**
- `extension/src/components/SignatureGallery.tsx`
- `extension/src/hooks/useSignatures.ts`

**Features:**
- [ ] Grid display of uploaded signatures
- [ ] Thumbnail previews
- [ ] Default signature indicator (star icon)
- [ ] Delete button with confirmation
- [ ] Set as default button
- [ ] Empty state (no signatures)

**Acceptance Criteria:**
- Shows all user signatures
- Default signature highlighted
- Delete requires confirmation
- Updates after CRUD operations

---

### Task 2.3: Signing Flow Integration
**Points:** 1  
**Assigned to:** Frontend Team

**Files to update:**
- `extension/src/components/SigningModal.tsx`

**Changes:**
- [ ] Add "Use Image Signature" checkbox
- [ ] Show signature selector dropdown
- [ ] Display selected signature preview
- [ ] Integrate with position selector
- [ ] Pass signature_id to backend

**Acceptance Criteria:**
- User can toggle between crypto-only and image signature
- Selected signature previews correctly
- Position on PDF is adjustable

---

## Sprint 3: PDF Embedding (Week 3) - 5 Points

### Task 3.1: PDF-lib Integration
**Points:** 3  
**Assigned to:** Frontend Team

**Files to create:**
- `extension/src/services/pdfImageEmbedder.ts`

**Functions:**
- [ ] `embedImageSignature(pdfDoc, imageUrl, position)`
- [ ] Load image from URL (PNG/JPG)
- [ ] Scale image to fit signature box
- [ ] Maintain aspect ratio
- [ ] Draw on specified page/position
- [ ] Add signature metadata annotation

**Acceptance Criteria:**
- Embeds PNG with transparency
- Embeds JPG correctly
- Scales properly
- Metadata stored in PDF structure

---

### Task 3.2: Signature Appearance Options
**Points:** 2  
**Assigned to:** Frontend Team

**Features:**
- [ ] Image only mode
- [ ] Image + text (name, date)
- [ ] Image + crypto hash (abbreviated)
- [ ] Custom font selection
- [ ] Border/frame options

**Acceptance Criteria:**
- All appearance modes work
- Text is readable
- Hash is correctly abbreviated

---

## Sprint 4: Testing & Polish (Week 4) - 3 Points

### Task 4.1: Backend Tests
**Points:** 1  
**Assigned to:** Backend Team

- [ ] Unit tests for ImageSignatureService
- [ ] Integration tests for upload flow
- [ ] Test file validation edge cases
- [ ] Test security (malicious files)
- [ ] Test rate limiting

**Target:** >85% code coverage

---

### Task 4.2: E2E Tests
**Points:** 1  
**Assigned to:** QA Team

- [ ] Test complete signing flow with image
- [ ] Test signature CRUD operations
- [ ] Test PDF embedding result
- [ ] Test error scenarios
- [ ] Test mobile devices (touch signature)

---

### Task 4.3: Performance & Security
**Points:** 1  
**Assigned to:** DevOps/Security

- [ ] Load test: 100 concurrent uploads
- [ ] Verify EXIF stripping
- [ ] Penetration test file upload
- [ ] Test MIME type spoofing
- [ ] Verify signed URL security
- [ ] Check storage costs/usage

---

## Dependencies

- **Backend** must complete Sprint 1 before Frontend starts Sprint 2
- **PDF embedding** requires completed signature gallery
- **Testing** requires all features implemented

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner approval

---

## Rollout Plan

1. **Alpha (Internal):** Week 5 - Internal team testing
2. **Beta (10% users):** Week 6 - Monitor errors and feedback
3. **GA (100% users):** Week 7 - Full rollout with announcement

---

**Last Updated:** 2026-06-13