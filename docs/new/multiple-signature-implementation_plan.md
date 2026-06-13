# Multiple Signers Feature - Implementation Plan

**Version:** 1.0.0  
**Date:** 2026-06-13  
**Status:** Planning  
**Feature:** Multiple Sequential Signers Support

---

## 1. Overview

### 1.1 Objective
Enable documents to require signatures from multiple signers in a defined sequence. Each signer must complete their signature before the next signer can proceed. Support both internal users and external recipients.

### 1.2 Business Value
- Support complex approval workflows
- Enable multi-party agreements and contracts
- Track signature status per signer
- Provide audit trail for compliance
- Compete with DocuSign/HelloSign multi-signer features

### 1.3 Use Cases
- **Purchase Orders:** Requester → Manager → Finance approval
- **HR Documents:** Employee → HR Manager → Legal review
- **Contracts:** Party A → Party B → Witness
- **Multi-tenant Agreements:** Landlord → Tenant 1 → Tenant 2

---

## 2. Technical Requirements

### 2.1 Core Features
- **Sequential Signing:** Enforce order of signers
- **Parallel Signing:** Optional - multiple signers at same level
- **Email Notifications:** Alert next signer when ready
- **Reminder System:** Auto-remind pending signers
- **Status Tracking:** Real-time status per signer
- **Delegation:** Allow signer to delegate to another person
- **Expiration:** Set deadline for signing

### 2.2 Signer Types
1. **Internal Users:** Existing TrustLessSign accounts
2. **External Recipients:** Email-only (temporary access)
3. **Guest Signers:** One-time verification link

### 2.3 Workflow States
```
DRAFT → PENDING → IN_PROGRESS → COMPLETED
                      ↓
                  DECLINED
                      ↓
                  EXPIRED
```

### 2.4 Signature Status Per Signer
- `PENDING` - Waiting for previous signer
- `READY` - Can sign now
- `SIGNED` - Completed
- `DECLINED` - Rejected document
- `DELEGATED` - Forwarded to another person

---

## 3. Architecture & Design

### 3.1 Component Overview

```
┌─────────────────────────────────────────┐
│         Document Workflow Engine        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Workflow State Machine           │ │
│  │  - DRAFT → PENDING → IN_PROGRESS  │ │
│  │  - Transition rules               │ │
│  └───────────────────────────────────┘ │
│                 │                       │
│                 ↓                       │
│  ┌───────────────────────────────────┐ │
│  │  Signer Queue Manager             │ │
│  │  - Order enforcement              │ │
│  │  - Next signer determination      │ │
│  └───────────────────────────────────┘ │
│                 │                       │
│                 ↓                       │
│  ┌───────────────────────────────────┐ │
│  │  Notification Service             │ │
│  │  - Email alerts                   │ │
│  │  - Reminders (cron)               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│         Database Layer                  │
│                                         │
│  ┌───────────────┐  ┌────────────────┐ │
│  │  documents    │  │  signers       │ │
│  │  - workflow   │→│  - order       │ │
│  │  - status     │  │  - status      │ │
│  └───────────────┘  └────────────────┘ │
└─────────────────────────────────────────┘
```

### 3.2 Database Schema

```sql
-- Add workflow support to documents table
ALTER TABLE documents ADD COLUMN workflow_type ENUM('single', 'sequential', 'parallel') DEFAULT 'single';
ALTER TABLE documents ADD COLUMN workflow_status ENUM('draft', 'pending', 'in_progress', 'completed', 'declined', 'expired') DEFAULT 'draft';
ALTER TABLE documents ADD COLUMN current_signer_id BIGINT UNSIGNED NULL;
ALTER TABLE documents ADD COLUMN expires_at TIMESTAMP NULL;
ALTER TABLE documents ADD COLUMN remind_after_days INT DEFAULT 3;

-- Create signers table
CREATE TABLE document_signers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    signer_email VARCHAR(255) NOT NULL,
    signer_name VARCHAR(255) NOT NULL,
    signer_order INT NOT NULL DEFAULT 1,
    
    status ENUM('pending', 'ready', 'signed', 'declined', 'delegated') DEFAULT 'pending',
    
    -- Signing details
    signed_at TIMESTAMP NULL,
    signature_data JSON NULL,
    signature_image_id BIGINT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- Delegation
    delegated_to_email VARCHAR(255) NULL,
    delegated_to_name VARCHAR(255) NULL,
    delegated_at TIMESTAMP NULL,
    delegation_reason TEXT NULL,
    
    -- Decline
    declined_at TIMESTAMP NULL,
    decline_reason TEXT NULL,
    
    -- Access control for external signers
    access_token VARCHAR(64) UNIQUE NULL,
    token_expires_at TIMESTAMP NULL,
    
    -- Notifications
    notified_at TIMESTAMP NULL,
    last_reminded_at TIMESTAMP NULL,
    reminder_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (signature_image_id) REFERENCES user_signatures(id) ON DELETE SET NULL,
    
    INDEX idx_document_order (document_id, signer_order),
    INDEX idx_document_status (document_id, status),
    INDEX idx_access_token (access_token),
    INDEX idx_user_pending (user_id, status)
);

-- Create workflow audit log
CREATE TABLE workflow_audit_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT UNSIGNED NOT NULL,
    signer_id BIGINT UNSIGNED NULL,
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (signer_id) REFERENCES document_signers(id) ON DELETE SET NULL,
    INDEX idx_document_time (document_id, created_at)
);
```

### 3.3 API Endpoints

#### Document Creation with Multiple Signers
```
POST /api/v1/documents/create-with-signers

Request:
{
  "document": {
    "title": "Purchase Order #12345",
    "file": <file upload>,
    "workflow_type": "sequential",
    "expires_at": "2026-07-01T00:00:00Z",
    "remind_after_days": 3
  },
  "signers": [
    {
      "email": "manager@company.com",
      "name": "Jane Manager",
      "order": 1,
      "message": "Please review and approve"
    },
    {
      "email": "cfo@company.com",
      "name": "John CFO",
      "order": 2,
      "message": "Final approval required"
    }
  ]
}

Response (201):
{
  "success": true,
  "data": {
    "document_id": 456,
    "workflow_status": "pending",
    "signers": [
      {
        "id": 1001,
        "email": "manager@company.com",
        "status": "ready",
        "order": 1
      },
      {
        "id": 1002,
        "email": "cfo@company.com",
        "status": "pending",
        "order": 2
      }
    ]
  }
}
```

#### Signer Actions
```
GET    /api/v1/documents/{id}/signers           # List all signers
POST   /api/v1/documents/{id}/sign              # Sign document (current signer)
POST   /api/v1/documents/{id}/decline           # Decline to sign
POST   /api/v1/documents/{id}/delegate          # Delegate to another person
GET    /api/v1/documents/{id}/workflow-status   # Get current workflow status
POST   /api/v1/documents/{id}/remind-signer     # Send reminder to current signer
```

#### External Signer Access
```
GET    /api/v1/external/documents/{token}       # Access document via token
POST   /api/v1/external/documents/{token}/sign  # Sign as external signer
```

---

## 4. Implementation Steps

### Phase 1: Database & Core Models (Week 1)

#### 4.1 Database Migrations
- [ ] Create `document_signers` table migration
- [ ] Create `workflow_audit_log` table migration
- [ ] Alter `documents` table for workflow fields
- [ ] Create indexes for performance

#### 4.2 Laravel Models
- [ ] Create `DocumentSigner` model
- [ ] Create `WorkflowAuditLog` model
- [ ] Update `Document` model with signer relationships
- [ ] Add workflow state machine logic

**DocumentSigner Model:**
```php
class DocumentSigner extends Model
{
    protected $fillable = [
        'document_id', 'user_id', 'signer_email', 'signer_name',
        'signer_order', 'status', 'access_token', 'token_expires_at'
    ];
    
    protected $casts = [
        'signature_data' => 'array',
        'signed_at' => 'datetime',
        'delegated_at' => 'datetime',
        'declined_at' => 'datetime',
        'token_expires_at' => 'datetime',
    ];
    
    public function document()
    {
        return $this->belongsTo(Document::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function isReady(): bool
    {
        return $this->status === 'ready';
    }
    
    public function markAsSigned(array $signatureData): void
    {
        $this->update([
            'status' => 'signed',
            'signed_at' => now(),
            'signature_data' => $signatureData,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
    
    public function generateAccessToken(): string
    {
        $token = Str::random(64);
        $this->update([
            'access_token' => $token,
            'token_expires_at' => now()->addDays(30),
        ]);
        return $token;
    }
}
```

#### 4.3 Workflow Service
- [ ] Create `WorkflowService` class
- [ ] Implement state machine logic
- [ ] Handle signer transitions
- [ ] Enforce signing order

**WorkflowService:**
```php
class WorkflowService
{
    public function initializeWorkflow(Document $document, array $signers): void
    {
        // Create signer records
        foreach ($signers as $index => $signerData) {
            $signer = DocumentSigner::create([
                'document_id' => $document->id,
                'signer_email' => $signerData['email'],
                'signer_name' => $signerData['name'],
                'signer_order' => $index + 1,
                'status' => $index === 0 ? 'ready' : 'pending',
            ]);
            
            // Generate access token for external signers
            if (!$signer->user_id) {
                $signer->generateAccessToken();
            }
        }
        
        // Update document status
        $document->update([
            'workflow_status' => 'in_progress',
            'current_signer_id' => $document->signers()->where('signer_order', 1)->first()->id,
        ]);
        
        // Send notification to first signer
        $this->notifyNextSigner($document);
    }
    
    public function processSignature(Document $document, DocumentSigner $signer, array $signatureData): void
    {
        DB::transaction(function () use ($document, $signer, $signatureData) {
            // Mark current signer as signed
            $signer->markAsSigned($signatureData);
            
            // Log action
            WorkflowAuditLog::create([
                'document_id' => $document->id,
                'signer_id' => $signer->id,
                'action' => 'signed',
                'previous_status' => 'ready',
                'new_status' => 'signed',
            ]);
            
            // Check if all signers completed
            if ($document->signers()->where('status', '!=', 'signed')->count() === 0) {
                $this->completeWorkflow($document);
            } else {
                $this->moveToNextSigner($document);
            }
        });
    }
    
    protected function moveToNextSigner(Document $document): void
    {
        $nextSigner = $document->signers()
            ->where('status', 'pending')
            ->orderBy('signer_order')
            ->first();
        
        if ($nextSigner) {
            $nextSigner->update(['status' => 'ready']);
            $document->update(['current_signer_id' => $nextSigner->id]);
            $this->notifyNextSigner($document);
        }
    }
    
    protected function completeWorkflow(Document $document): void
    {
        $document->update([
            'workflow_status' => 'completed',
            'current_signer_id' => null,
        ]);
        
        // Notify all signers that document is complete
        foreach ($document->signers as $signer) {
            Mail::to($signer->signer_email)->send(new DocumentCompletedMail($document));
        }
    }
    
    protected function notifyNextSigner(Document $document): void
    {
        $currentSigner = $document->currentSigner;
        
        if ($currentSigner) {
            $currentSigner->update(['notified_at' => now()]);
            Mail::to($currentSigner->signer_email)->send(new SigningRequestMail($document, $currentSigner));
        }
    }
}
```

### Phase 2: API Implementation (Week 2)

#### 4.4 Document Creation API
- [ ] Create `DocumentWithSignersController`
- [ ] Implement multipart file upload with signer data
- [ ] Validate signer order and emails
- [ ] Initialize workflow after document upload

#### 4.5 Signing API
- [ ] Implement signer authentication (token-based for external)
- [ ] Validate signer is current signer
- [ ] Process signature and move workflow forward
- [ ] Return updated status

#### 4.6 Workflow Management API
- [ ] Get workflow status endpoint
- [ ] Decline document endpoint
- [ ] Delegate to another signer endpoint
- [ ] Send reminder endpoint (manual)

### Phase 3: Chrome Extension UI (Week 3)

#### 4.7 Multi-Signer UI Components
- [ ] Create signer management modal
- [ ] Add signer input fields (email, name, order)
- [ ] Drag-and-drop to reorder signers
- [ ] Workflow progress visualization
- [ ] Status badges per signer

#### 4.8 External Signer Landing Page
- [ ] Create public signing page (accessible via token)
- [ ] Display document preview
- [ ] Show signing context (who signed, who's next)
- [ ] Email verification step
- [ ] Signature capture and submission

#### 4.9 Notifications Integration
- [ ] Email templates for signing requests
- [ ] Email templates for reminders
- [ ] Email template for completed documents
- [ ] In-app notifications for internal users

### Phase 4: Testing & Deployment (Week 4)

#### 4.10 Testing
- [ ] Unit tests for WorkflowService
- [ ] Integration tests for multi-signer flow
- [ ] E2E test: 3-signer sequential workflow
- [ ] Test email delivery
- [ ] Test token expiration handling
- [ ] Test delegation flow
- [ ] Test decline flow

#### 4.11 Deployment
- [ ] Database migration on staging
- [ ] Deploy backend changes
- [ ] Deploy Chrome extension update
- [ ] Monitor error rates
- [ ] Performance testing with concurrent workflows

---

## 5. Security Considerations

### 5.1 Access Control
- Signers can only view/sign documents they're assigned to
- Access tokens are single-use and expire after 30 days
- Email verification required for external signers
- Rate limiting on signing attempts (5 per hour)

### 5.2 Audit Trail
- All workflow transitions logged
- IP address and user agent captured
- Immutable audit log (no deletions)
- Timestamp all actions with millisecond precision

### 5.3 Data Privacy
- External signers' emails not shared with other signers (optional config)
- Document content only accessible to assigned signers
- Signed documents encrypted at rest
- GDPR compliance: data deletion requests handled

---

## 6. Success Metrics

- **Adoption Rate:** >30% of users create multi-signer documents within 3 months
- **Completion Rate:** >85% of workflows completed successfully
- **Average Time to Complete:** <48 hours for 3-signer workflows
- **Email Delivery Rate:** >99%
- **Decline Rate:** <10%
- **Support Tickets:** <3% increase

---

## 7. Future Enhancements

- Parallel signing (multiple signers at same level)
- Conditional workflows (if-then routing)
- Signer groups and roles
- Mobile app support
- Webhook notifications for workflow events
- Integration with Zapier/Make for automation

---

**Document Status:** Ready for implementation  
**Last Updated:** 2026-06-13