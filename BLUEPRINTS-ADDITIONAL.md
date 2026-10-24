# Additional Blueprints Required

**IdentityPlatform — Supplementary Architecture Documents**

---

## Overview

Access Control Blueprint V2 ni tayyorlash chog'ida 7 ta qo'shimcha blueprint zarurligi aniqlandi. Bu blueprint'lar Access Control bilan integratsiyalashgan holda to'liq platformani qurish uchun kerak.

---

## 1. Device Management Blueprint

### 1.1 Purpose

Device lifecycle, trust levels, registration, revocation, va anomaly detection'ni belgilaydi.

### 1.2 Key Components

**Device Entity:**
```typescript
class Device {
  id: DeviceId;
  userId: UserId;
  deviceName: string;
  deviceType: DeviceType;  // desktop, mobile, tablet
  os: string;
  browser: string;
  
  ipAddress: string;
  location: {
    city: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  trustLevel: TrustLevel;  // trusted, unknown, untrusted
  lastActiveAt: Date;
  createdAt: Date;
}
```

**Trust Levels:**
- **Trusted** — user tomonidan tasdiqlangan
- **Unknown** — yangi device
- **Untrusted** — shubhali device

**Device Registration:**
- Device fingerprinting
- User confirmation (email/SMS)
- Trust level assignment

**Device Revocation:**
- User o'zi revocation qiladi
- Admin revocation qiladi
- Automatic revocation (inactive > 90 days)

**Anomaly Detection:**
- Yangi location
- Yangi device
- Xatti-harakat patterns

### 1.3 Integration with Access Control

- Decision chain'da "Device trust check" (Step 4)
- Untrusted device → step-up MFA
- Trusted device → normal access

### 1.4 Database Schema

```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  os TEXT,
  browser TEXT,
  ip_address TEXT,
  location_city TEXT,
  location_country TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  trust_level TEXT NOT NULL,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_devices_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_trust_level ON devices(trust_level);
```

---

## 2. MFA Blueprint

### 2.1 Purpose

Multi-factor authentication (TOTP, SMS, email, backup codes, FIDO2/WebAuthn) ni belgilaydi.

### 2.2 Key Components

**MFA Methods:**
- **TOTP** — Google Authenticator, Authy
- **SMS OTP** — SMS kod
- **Email OTP** — Email kod
- **Backup Codes** — 10 ta kod
- **FIDO2/WebAuthn** — passkey

**MFA Entity:**
```typescript
class MFA {
  id: MFAId;
  userId: UserId;
  method: MFAMethod;  // TOTP, SMS, EMAIL, BACKUP_CODE, FIDO2
  secret: string;  // TOTP secret
  phoneNumber: string;  // SMS
  email: string;  // email
  backupCodes: string[];  // backup codes
  credentialId: string;  // FIDO2
  publicKey: string;  // FIDO2
  counter: number;  // TOTP counter
  enabled: boolean;
  verified: boolean;
  createdAt: Date;
}
```

**Step-Up Authentication:**
- Sensitive action'lar yuqori auth level talab qiladi
- `auth_level: 1` — password only
- `auth_level: 2` — password + MFA
- `auth_level: 3` — password + MFA + hardware key

### 2.3 Integration with Access Control

- Decision chain'da "Authentication level check"
- Sensitive permission'lar yuqori auth level talab qiladi

### 2.4 Database Schema

```sql
CREATE TABLE mfa_methods (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  method TEXT NOT NULL,
  secret TEXT,
  phone_number TEXT,
  email TEXT,
  backup_codes JSONB,
  credential_id TEXT,
  public_key TEXT,
  counter INTEGER DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_mfa_methods_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_mfa_methods_user_id ON mfa_methods(user_id);
CREATE INDEX idx_mfa_methods_method ON mfa_methods(method);
```

---

## 3. Session Management Blueprint

### 3.1 Purpose

Session lifecycle, JWT refresh tokens, session revocation, rotation, va device-bound sessions ni belgilaydi.

### 3.2 Key Components

**Session Entity:**
```typescript
class Session {
  id: SessionId;
  userId: UserId;
  deviceId: DeviceId;
  refreshTokenHash: string;  // HASHED
  accessToken: string;
  expiresAt: Date;
  revokedAt: Date;
  lastActiveAt: Date;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
```

**Session Lifecycle:**
- Login → session create
- Refresh → session extend
- Logout → session revoke
- Timeout → session expire
- Revoke → session delete

**Token Rotation:**
- Refresh token har safar rotatsiya qilinadi
- Eski token invalidate bo'ladi
- Replay protection

**Device Binding:**
- Session device'ga bog'langan
- Device revocation → session revoke

### 3.3 Integration with Access Control

- Decision chain'da "Session validity check" (Step 2)
- Session expired/revoked → DENY

### 3.4 Database Schema

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID,
  refresh_token_hash TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_device_id FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_device_id ON sessions(device_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## 4. Delegation Blueprint

### 4.1 Purpose

Permission delegation, temporary grants, approval workflows, va impersonation ni belgilaydi.

### 4.2 Key Components

**Delegation Entity:**
```typescript
class Delegation {
  id: DelegationId;
  delegatorId: UserId;  // kim berdi
  delegateeId: UserId;  // kim oldi
  membershipId: MembershipId;  // qaysi tenant kontekstida
  permissions: PermissionKey[];
  expiresAt: Date;
  approvedBy: UserId;  // approval workflow
  status: DelegationStatus;  // PENDING, APPROVED, REJECTED, ACTIVE, EXPIRED
  reason: string;
  createdAt: Date;
}
```

**Delegation Types:**
- **Direct Delegation** — user boshqa user'ga vakolat beradi
- **Temporary Grant** — vaqtinchalik vakolat
- **Impersonation** — admin boshqa user nomidan ishlaydi
- **Approval Workflow** — delegatsiya uchun approval

### 4.3 Integration with Access Control

- Decision chain'da "Delegation check" (Step 15)
- Delegated permission — original permission ustidan override

### 4.4 Database Schema

```sql
CREATE TABLE delegations (
  id UUID PRIMARY KEY,
  delegator_id UUID NOT NULL,
  delegatee_id UUID NOT NULL,
  membership_id UUID NOT NULL,
  permissions JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_delegations_delegator_id FOREIGN KEY (delegator_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_delegations_delegatee_id FOREIGN KEY (delegatee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_delegations_membership_id FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
);

CREATE INDEX idx_delegations_delegator_id ON delegations(delegator_id);
CREATE INDEX idx_delegations_delegatee_id ON delegations(delegatee_id);
CREATE INDEX idx_delegations_status ON delegations(status);
```

---

## 5. API Key Management Blueprint

### 5.1 Purpose

API key lifecycle, scopes, rotation, rate limiting, va service accounts ni belgilaydi.

### 5.2 Key Components

**API Key Entity:**
```typescript
class ApiKey {
  id: ApiKeyId;
  keyHash: string;  // HASHED
  keyPrefix: string;  // display prefix (e.g., "pk_...")
  userId: UserId;
  membershipId: MembershipId;
  scopes: string[];  // permission scopes
  rateLimit: number;  // requests per minute
  expiresAt: Date;
  lastUsedAt: Date;
  status: ApiKeyStatus;  // ACTIVE, REVOKED, EXPIRED
  createdAt: Date;
}
```

**API Key Lifecycle:**
- Create → key generate
- Use → rate limit check
- Rotate → key regenerate
- Revoke → key invalidate
- Expire → key expire

**Service Account:**
- Machine-to-machine authentication
- No human user
- API key or OAuth client credentials

### 5.3 Integration with Access Control

- API key scopes → permission mapping
- Rate limit check (Step 14)

### 5.4 Database Schema

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  user_id UUID,
  membership_id UUID,
  scopes JSONB NOT NULL,
  rate_limit INTEGER NOT NULL DEFAULT 100,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_api_keys_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_api_keys_membership_id FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_membership_id ON api_keys(membership_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
```

---

## 6. Conditional Access Blueprint

### 6.1 Purpose

Advanced ABAC policies, risk-based access, adaptive authentication, geo-fencing, IP allowlist/blocklist, va time-based access ni belgilaydi.

### 6.2 Key Components

**Conditional Access Policy:**
```typescript
class ConditionalAccessPolicy {
  id: PolicyId;
  tenantId: TenantId;
  name: string;
  conditions: {
    geoFencing: {
      allowedCountries: string[];
      blockedCountries: string[];
    };
    ipAllowlist: string[];
    ipBlocklist: string[];
    timeWindow: {
      start: string;  // "09:00"
      end: string;  // "17:00"
      timezone: string;
    };
    devicePosture: {
      antivirusRequired: boolean;
      osVersionMin: string;
      encryptionRequired: boolean;
    };
    riskLevel: 'low' | 'medium' | 'high';
  };
  action: 'allow' | 'deny' | 'require_mfa' | 'require_step_up';
  priority: number;
  isActive: boolean;
  createdAt: Date;
}
```

**Risk-Based Access:**
- Risk score calculation
- Adaptive authentication
- Step-up MFA for high risk

**Geo-Fencing:**
- Faqat ma'lum davlatdan
- Block ma'lum davlatlar

**IP Allowlist/Blocklist:**
- Faqat ma'lum IP'lardan
- Block ma'lum IP'lar

**Time-Based Access:**
- Faqat ish vaqtida
- Maintenance window

### 6.3 Integration with Access Control

- ABAC policy evaluation (Step 12)
- Risk score calculation
- Conditional access decisions

### 6.4 Database Schema

```sql
CREATE TABLE conditional_access_policies (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  name TEXT NOT NULL,
  geo_fencing JSONB,
  ip_allowlist JSONB,
  ip_blocklist JSONB,
  time_window JSONB,
  device_posture JSONB,
  risk_level TEXT,
  action TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_conditional_access_policies_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_conditional_access_policies_tenant_id ON conditional_access_policies(tenant_id);
CREATE INDEX idx_conditional_access_policies_priority ON conditional_access_policies(priority);
```

---

## 7. Audit & Compliance Blueprint

### 7.1 Purpose

Comprehensive audit, compliance reporting, forensics, data retention, immutable storage, va hash chain validation ni belgilaydi.

### 7.2 Key Components

**Audit Event Types:**
- Authorization decisions
- Permission changes
- Role changes
- Membership changes
- Delegation changes
- Policy changes
- API key changes
- Device changes
- Session changes

**Audit Log Entity:**
```typescript
class AuditLog {
  id: AuditLogId;
  correlationId: UUID;
  requestId: UUID;
  eventType: AuditEventType;
  actorUserId: UserId;
  subjectUserId: UserId;
  tenantId: TenantId;
  action: string;
  resourceType: string;
  resourceId: UUID;
  beforeState: Record<string, any>;
  afterState: Record<string, any>;
  decision: string;
  reason: string;
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  timestamp: Date;
  hash: string;  // hash chain
}
```

**Immutable Storage:**
- Append-only storage
- Hash chain validation
- Tamper-evident

**Compliance Reporting:**
- GDPR report
- SOC 2 report
- ISO 27001 report
- Custom reports

**Data Retention:**
- 7 years default
- Configurable per event type
- Automatic cleanup

### 7.3 Integration with Access Control

- Authorization audit log (existing in V2)
- All access control changes logged
- Hash chain validation

### 7.4 Database Schema

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  correlation_id UUID NOT NULL,
  request_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id UUID,
  subject_user_id UUID,
  tenant_id UUID,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  before_state JSONB,
  after_state JSONB,
  decision TEXT,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  device_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  hash TEXT,
  CONSTRAINT uq_audit_log_correlation_id UNIQUE(correlation_id)
);

CREATE INDEX idx_audit_log_user_id ON audit_log(subject_user_id);
CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
```

---

## Blueprint Priority Order

### Phase 1: Core Authentication & Authorization
1. **Session Management Blueprint** — Access Control uchun zarur
2. **Device Management Blueprint** — Session'lar uchun zarur
3. **MFA Blueprint** — Step-up authentication uchun zarur

### Phase 2: Advanced Authorization
4. **Delegation Blueprint** — Advanced use cases
5. **API Key Management Blueprint** — Programmatic access
6. **Conditional Access Blueprint** — Advanced ABAC

### Phase 3: Compliance & Governance
7. **Audit & Compliance Blueprint** — Enterprise readiness

---

## Implementation Dependencies

```
Access Control V2
  ↓
Session Management
  ↓
Device Management
  ↓
MFA
  ↓
Delegation
  ↓
API Key Management
  ↓
Conditional Access
  ↓
Audit & Compliance
```

---

## Open Questions

### QUESTION-001: Device Fingerprinting Method

**Savol:** Device fingerprinting qanday method bilan amalga oshiriladi?

**Options:**
A. Browser fingerprinting (JS-based)
B. Device ID (mobile SDK)
C. Both

**Recommendation:** Both (desktop uchun browser, mobile uchun SDK)

---

### QUESTION-002: MFA Backup Codes Count

**Savol:** Backup codes nechta bo'lishi kerak?

**Options:**
A. 5 codes
B. 10 codes
C. 15 codes

**Recommendation:** 10 codes (industry standard)

---

### QUESTION-003: Session Rotation Strategy

**Savol:** Refresh token qachon rotatsiya qilinadi?

**Options:**
A. Har safar refresh
B. Faqat security event'dan keyin
C. Periodic (har 24 soat)

**Recommendation:** Har safar refresh (security-first)

---

### QUESTION-004: Delegation Approval Workflow

**Savol:** Delegation uchun approval workflow kerakmi?

**Options:**
A. Required for all delegations
B. Required for high-risk delegations
C. Not required

**Recommendation:** Required for high-risk delegations

---

### QUESTION-005: API Key Prefix Length

**Savol:** API key display prefix uzunligi qancha?

**Options:**
A. 4 characters (e.g., "pk_...")
B. 8 characters
C. 12 characters

**Recommendation:** 8 characters (secure + usable)

---

### QUESTION-006: Conditional Access Risk Scoring

**Savol:** Risk scoring qanday model bilan amalga oshiriladi?

**Options:**
A. Simple (low/medium/high)
B. Complex (0-100 score)
C. ML-based

**Recommendation:** Simple (easier to implement and explain)

---

### QUESTION-007: Audit Log Storage

**Savol:** Audit log qayerda saqlanadi?

**Options:**
A. Same database
B. Separate database
C. External service (e.g., Elasticsearch)

**Recommendation:** Separate database (isolation)

---

## Final Checklist

- [x] Device Management Blueprint
- [x] MFA Blueprint
- [x] Session Management Blueprint
- [x] Delegation Blueprint
- [x] API Key Management Blueprint
- [x] Conditional Access Blueprint
- [x] Audit & Compliance Blueprint
- [x] Blueprint Priority Order
- [x] Implementation Dependencies
- [x] Open Questions (7)

---

**END OF ADDITIONAL BLUEPRINTS REQUIRED**
