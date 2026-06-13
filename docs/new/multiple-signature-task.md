# Multiple Signers Feature - Development Tasks

**Sprint:** TrustLessSign v1.4.0  
**Epic:** Multiple Sequential Signers Support  
**Story Points:** 34  
**Duration:** 4 weeks

---

## Sprint 1: Backend Foundation (Week 1) - 13 Points

### Task 1.1: Database Migrations
**Points:** 3  
**Assigned to:** Backend Team

- [ ] Create migration for `document_signers` table
- [ ] Create migration for `workflow_audit_log` table
- [ ] Alter `documents` table: add workflow columns (workflow_type, workflow_status, current_signer_id, expires_at, remind_after_days)
- [ ] Create all required indexes
- [ ] Test migrations on staging database
- [ ] Create rollback migration

**Acceptance Criteria:**
- All migrations run successfully
- Indexes created for performance
- Foreign keys enforced
- Rollback tested

---

### Task 1.2: Laravel Models
**Points:** 4  
**Assigned to:** Backend Team

**Files to create:**
- `app/Models/DocumentSigner.php`
- `app/Models/WorkflowAuditLog.php`
- Update `app/Models/Document.php`

**DocumentSigner Model:**
- [ ] Define fillable fields and casts
- [ ] Relationships: document(), user(), signatureImage()
- [ ] Methods: isReady(), markAsSigned(), generateAccessToken()
- [ ] Scopes: ready(), pending(), signed()

**WorkflowAuditLog Model:**
- [ ] Define fillable fields
- [ ] Relationships to Document and Signer
- [ ] Immutable (no updates/deletes)

**Document Model Updates:**
- [ ] Add signers() relationship
- [ ] Add currentSigner() relationship
- [ ] Add workflow status helpers

**Acceptance Criteria:**
- Unit tests pass (>80% coverage)
- All relationships working
- Token generation secure (64-char random)

---

### Task 1.3: Workflow Service
**Points:** 5  
**Assigned to:** Backend Team

**Files to create:**
- `app/Services/WorkflowService.php`
- `app/Exceptions/WorkflowException.php`

**Methods to implement:**
- [ ] `initializeWorkflow(Document, array $signers)` - Create signer records, set statuses
- [ ] `processSignature(Document, Signer, array $data)` - Handle signature, move to next
- [ ] `moveToNextSigner(Document)` - Transition workflow
- [ ] `completeWorkflow(Document)` - Mark as completed
- [ ] `declineDocument(Document, Signer, string $reason)` - Handle rejection
- [ ] `delegateSigner(Signer, string $email, string $name)` - Delegate to another person
- [ ] `notifyNextSigner(Document)` - Send email notification

**Acceptance Criteria:**
- State machine transitions correctly
- Enforces signer order
- Logs all state changes to audit table
- Handles edge cases (last signer, delegation)
- Unit tests pass

---

### Task 1.4: Notification System
**Points:** 1  
**Assigned to:** Backend Team

**Files to create:**
- `app/Mail/SigningRequestMail.php`
- `app/Mail/DocumentCompletedMail.php`
- `app/Mail/SignerReminderMail.php`
- `resources/views/emails/signing-request.blade.php`
- `resources/views/emails/document-completed.blade.php`

**Acceptance Criteria:**
- Email templates are mobile-responsive
- Includes document title, current status
- Links to signing page (with token)
- Unsubscribe link included

---

## Sprint 2: API Endpoints (Week 2) - 8 Points

### Task 2.1: Document Creation with Signers API
**Points:** 3  
**Assigned to:** Backend Team

**Files to create:**
- `app/Http/Controllers/Api/DocumentWorkflowController.php`
- `app/Http/Requests/CreateDocumentWithSignersRequest.php`

**Endpoint:**
```
POST /api/v1/documents/create-with-signers
```

**Implementation:**
- [ ] Accept multipart/form-data (file + signer JSON)
- [ ] Validate signer emails (format, duplicates)
- [ ] Validate signer order (sequential, no gaps)
- [ ] Upload document to storage
- [ ] Initialize workflow via WorkflowService
- [ ] Return created document + signer statuses

**Acceptance Criteria:**
- Handles up to 10 signers
- Validates email format
- Rejects duplicate signers
- API tests pass
- Rate limited (10 per hour)

---

### Task 2.2: Signer Management Endpoints
**Points:** 2  
**Assigned to:** Backend Team

**Endpoints:**
```
GET    /api/v1/documents/{id}/signers
POST   /api/v1/documents/{id}/sign
POST   /api/v1/documents/{id}/decline
POST   /api/v1/documents/{id}/delegate
GET    /api/v1/documents/{id}/workflow-status
POST   /api/v1/documents/{id}/remind-signer
```

**Implementation:**
- [ ] List signers with status
- [ ] Sign document (validate current signer)
- [ ] Decline with reason
- [ ] Delegate to another email
- [ ] Get workflow status
- [ ] Send manual reminder

**Acceptance Criteria:**
- Authorization checks (only assigned signer can sign)
- Workflow transitions correctly
- Audit log entries created
- API tests cover all endpoints

---

### Task 2.3: External Signer Access API
**Points:** 2  
**Assigned to:** Backend Team

**Endpoints:**
```
GET    /api/v1/external/documents/{token}
POST   /api/v1/external/documents/{token}/sign
POST   /api/v1/external/documents/{token}/verify-email
```

**Implementation:**
- [ ] Token-based authentication (no login required)
- [ ] Validate token expiration (30 days)
- [ ] Email verification step for external signers
- [ ] Return document preview and signer context
- [ ] Handle signature submission

**Acceptance Criteria:**
- Expired tokens rejected
- Email verification required
- Rate limiting (5 sign attempts per hour)
- Security tests pass

---

### Task 2.4: Cron Job for Reminders
**Points:** 1  
**Assigned to:** Backend Team

**Files to create:**
- `app/Console/Commands/SendSignerReminders.php`

**Implementation:**
- [ ] Find pending signers with status='ready'
- [ ] Filter: notified >3 days ago, reminder_count <3
- [ ] Send reminder email
- [ ] Update last_reminded_at, increment reminder_count
- [ ] Schedule: runs daily at 9 AM

**Acceptance Criteria:**
- Max 3 reminders per signer
- Respects remind_after_days setting
- Logs reminder activity

---

## Sprint 3: Frontend/Extension UI (Week 3) - 8 Points

### Task 3.1: Signer Management UI
**Points:** 3  
**Assigned to:** Frontend Team

**Files to create:**
- `extension/src/components/SignerManagementModal.tsx`
- `extension/src/hooks/useSigners.ts`

**Features:**
- [ ] Add signer form (email, name, custom message)
- [ ] Drag-and-drop to reorder signers
- [ ] Delete signer button
- [ ] Workflow type selector (sequential/parallel)
- [ ] Expiration date picker
- [ ] Reminder frequency input

**Acceptance Criteria:**
- Validates email format
- Prevents duplicate emails
- Shows signer order clearly
- Mobile responsive

---

### Task 3.2: Workflow Status Display
**Points:** 2  
**Assigned to:** Frontend Team

**Files to create:**
- `extension/src/components/WorkflowStatus.tsx`
- `extension/src/components/SignerStatusBadge.tsx`

**Features:**
- [ ] Progress bar showing completed/total signers
- [ ] List of signers with status badges (pending/ready/signed/declined)
- [ ] Timestamp for signed signers
- [ ] Current signer highlighted
- [ ] Decline reason display

**Acceptance Criteria:**
- Real-time updates via polling or WebSocket
- Color-coded status (green=signed, yellow=ready, gray=pending, red=declined)
- Shows who signed when

---

### Task 3.3: External Signer Landing Page
**Points:** 2  
**Assigned to:** Frontend Team

**Files to create:**
- `public/sign/{token}.html` (or React route)
- `extension/src/pages/ExternalSigningPage.tsx`

**Features:**
- [ ] Document preview (PDF viewer)
- [ ] Signing context (who signed before, who's next)
- [ ] Email verification form
- [ ] Signature capture (drawing pad)
- [ ] Decline form with reason
- [ ] Success confirmation

**Acceptance Criteria:**
- Works without Chrome extension
- Mobile-friendly (touchscreen signature)
- Clear instructions for external users
- Handles expired tokens gracefully

---

### Task 3.4: Document List Integration
**Points:** 1  
**Assigned to:** Frontend Team

**Files to update:**
- `extension/src/components/DocumentList.tsx`

**Changes:**
- [ ] Show workflow status badge on multi-signer documents
- [ ] Filter: "Pending My Signature" tab
- [ ] Show signer progress (2/3 signed)
- [ ] Quick action: "Remind Current Signer"

**Acceptance Criteria:**
- Distinguishes single vs multi-signer docs
- Filters work correctly

---

## Sprint 4: Testing & Deployment (Week 4) - 5 Points

### Task 4.1: Backend Tests
**Points:** 2  
**Assigned to:** Backend Team

- [ ] Unit tests for WorkflowService (all methods)
- [ ] Integration tests for workflow state transitions
- [ ] Test email sending (mocked)
- [ ] Test token generation and expiration
- [ ] Test delegation flow
- [ ] Test concurrent signing attempts (race conditions)

**Target:** >85% code coverage

---

### Task 4.2: E2E Tests
**Points:** 2  
**Assigned to:** QA Team

**Scenarios:**
- [ ] Create document with 3 signers, complete full workflow
- [ ] Signer 2 declines, workflow stops
- [ ] Signer 1 delegates to another person
- [ ] External signer signs via email link
- [ ] Expired document not signable
- [ ] Reminder emails sent after 3 days

**Tools:** Playwright or Cypress

---

### Task 4.3: Deployment & Monitoring
**Points:** 1  
**Assigned to:** DevOps Team

- [ ] Deploy database migrations to staging
- [ ] Deploy backend to staging
- [ ] Deploy extension to Chrome Web Store (beta channel)
- [ ] Set up monitoring for workflow errors
- [ ] Set up email delivery monitoring
- [ ] Load test: 50 concurrent workflows

**Acceptance Criteria:**
- Zero downtime deployment
- Monitoring dashboards configured
- Rollback plan documented

---

## Dependencies

- **API Endpoints** depend on Workflow Service completion
- **Frontend UI** depends on API completion
- **E2E Tests** require both backend and frontend complete
- **External Signer Page** can be developed in parallel

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing (>85% coverage)
- [ ] API documentation updated
- [ ] User guide updated (multi-signer workflow)
- [ ] Deployed to staging
- [ ] Product owner approval

---

## Rollout Plan

1. **Alpha (Internal):** Week 5 - Internal team testing (10 users)
2. **Beta (5% users):** Week 6 - Monitor errors, email delivery rates
3. **Beta (25% users):** Week 7 - Expand if no critical issues
4. **GA (100% users):** Week 8 - Full rollout with announcement

---

## Risk Mitigation

**Risk:** Email delivery issues (spam filters)  
**Mitigation:** Use SendGrid/AWS SES, proper SPF/DKIM setup

**Risk:** Race conditions in workflow transitions  
**Mitigation:** Database transactions, pessimistic locking

**Risk:** External signers confused by process  
**Mitigation:** Clear instructions, help tooltips, demo video

---

**Last Updated:** 2026-06-13