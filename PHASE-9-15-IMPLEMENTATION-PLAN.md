# PHASE 9.15 Implementation Plan

## Implementation Order

### 1. Magic Link (PHASE 9.15.3)
**Status**: IN PROGRESS

**Components Required**:
- [x] Domain: MagicLinkToken entity
- [x] Domain: MagicLinkTokenRepository interface
- [x] Database: magic_link_tokens table with UNIQUE constraint on unconsumed tokens
- [ ] Migration: Create magic_link_tokens table
- [ ] Infrastructure: DrizzleMagicLinkTokenRepository
- [ ] Infrastructure: InMemoryMagicLinkTokenRepository
- [ ] Application: SendMagicLinkCommand
- [ ] Application: SendMagicLinkHandler
- [ ] Application: VerifyMagicLinkCommand
- [ ] Application: VerifyMagicLinkHandler
- [ ] Presentation: MagicLinkValidator
- [ ] Presentation: MagicLinkVerifyValidator
- [ ] Presentation: AuthController routes
- [ ] Security: Concurrency test (N concurrent consumers → exactly 1 success)
- [ ] Security: Replay test (consumed token → rejected)
- [ ] Security: Expiration test (expired token → rejected)
- [ ] Security: Enumeration resistance test
- [ ] Security: Rate limiting implementation
- [ ] Events: MAGIC_LINK_REQUESTED, MAGIC_LINK_CONSUMED

**Database Invariants**:
```sql
UNIQUE (token_digest) WHERE consumed_at IS NULL
```

**Concurrency Proof Required**:
- Test: N concurrent requests with same token
- Expected: Exactly 1 success, N-1 rejections
- Method: Real PostgreSQL transaction with advisory lock or UPDATE ... RETURNING

---

### 2. Email Verification (PHASE 9.15.8)
**Status**: NOT STARTED

**Components Required**:
- Domain: EmailVerificationToken entity
- Domain: EmailVerificationTokenRepository interface
- Database: email_verification_tokens table
- Migration: Create email_verification_tokens table
- Infrastructure: DrizzleEmailVerificationTokenRepository
- Infrastructure: InMemoryEmailVerificationTokenRepository
- Application: SendVerificationEmailCommand
- Application: SendVerificationEmailHandler
- Application: VerifyEmailCommand
- Application: VerifyEmailHandler
- Presentation: EmailVerificationValidator
- Presentation: VerifyEmailValidator
- Security: Change-email security (old/new email semantics)
- Security: Enumeration resistance
- Events: EMAIL_VERIFIED

**Database Invariants**:
```sql
UNIQUE (email, token_digest) WHERE verified_at IS NULL
```

---

### 3. Password Reset (PHASE 9.15.7)
**Status**: NOT STARTED

**Components Required**:
- Domain: PasswordResetToken entity
- Domain: PasswordResetTokenRepository interface
- Database: password_reset_tokens table
- Migration: Create password_reset_tokens table
- Infrastructure: DrizzlePasswordResetTokenRepository
- Infrastructure: InMemoryPasswordResetTokenRepository
- Application: RequestPasswordResetCommand
- Application: RequestPasswordResetHandler
- Application: ResetPasswordCommand
- Application: ResetPasswordHandler
- Presentation: RequestPasswordResetValidator
- Presentation: ResetPasswordValidator
- Security: Session invalidation policy
- Security: Token family invalidation
- Events: PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED

**Database Invariants**:
```sql
UNIQUE (token_digest) WHERE consumed_at IS NULL
```

---

### 4. Security Audit Events (PHASE 9.15.10)
**Status**: NOT STARTED

**Components Required**:
- Domain: AuditLog entity (already exists, verify completeness)
- Domain: AuditLogRepository interface (already exists, verify completeness)
- Database: audit_logs table (verify completeness)
- Application: AuditService
- Infrastructure: DrizzleAuditLogRepository
- Infrastructure: InMemoryAuditLogRepository
- Event Types:
  - LOGIN_SUCCESS
  - LOGIN_FAILURE
  - MAGIC_LINK_REQUESTED
  - MAGIC_LINK_CONSUMED
  - PASSWORD_RESET_REQUESTED
  - PASSWORD_RESET_COMPLETED
  - EMAIL_VERIFIED
  - ACCOUNT_LINK_STARTED
  - ACCOUNT_LINK_COMPLETED
  - ACCOUNT_LINK_REJECTED
  - MFA_ENABLED
  - MFA_DISABLED
  - MFA_FAILURE
  - RECOVERY_STARTED
  - RECOVERY_COMPLETED
  - SESSION_REVOKED
  - REFRESH_TOKEN_REUSE_DETECTED

**Security Requirements**:
- Events must NOT contain: passwords, raw tokens, secrets, auth codes, MFA secrets
- Verify transaction/outbox semantics for durability

---

### 5. Session Security Policy (PHASE 9.15.9)
**Status**: NOT STARTED

**Components Required**:
- Domain: Session entity (exists, verify completeness)
- Domain: SessionRepository interface (exists, verify completeness)
- Application: SessionPolicyService
- Policies for:
  - Login: which sessions remain valid?
  - Magic Link Login: session behavior
  - Password Reset: session invalidation
  - MFA Enable: session behavior
  - MFA Disable: session behavior
  - Account Recovery: session behavior
  - Account Linking: session behavior
  - Password Change: session behavior
- Token Revocation / Reuse Detection
- Refresh Token Family Management

---

### 6. MFA (PHASE 9.15.5)
**Status**: NOT STARTED

**Components Required**:
- Domain: MfaSettings entity
- Domain: MfaBackupCode entity
- Domain: MfaSettingsRepository interface
- Domain: MfaBackupCodeRepository interface
- Database: mfa_settings table
- Database: mfa_backup_codes table
- Migration: Create MFA tables
- Infrastructure: DrizzleMfaSettingsRepository
- Infrastructure: DrizzleMfaBackupCodeRepository
- Infrastructure: InMemoryMfaSettingsRepository
- Infrastructure: InMemoryMfaBackupCodeRepository
- Application: EnableMFACommand
- Application: EnableMFAHandler
- Application: VerifyMFACommand
- Application: VerifyMFAHandler
- Application: DisableMFACommand
- Application: DisableMFAHandler
- Security: TOTP secret protection
- Security: Clock drift policy
- Security: Recovery code single-use atomic consumption
- Security: Rate limiting
- Events: MFA_ENABLED, MFA_DISABLED, MFA_FAILURE

**Database Invariants**:
```sql
UNIQUE (user_id, authenticator_type, authenticator_identifier)
UNIQUE (code_digest) WHERE consumed_at IS NULL
```

**State Transitions**:
- UNENROLLED → ENROLLING → ENABLED → DISABLED
- ENABLED → RECOVERY → ENABLED

---

### 7. Identity Recovery (PHASE 9.15.6)
**Status**: NOT STARTED

**Components Required**:
- Domain: AccountRecoveryToken entity
- Domain: AccountRecoveryTokenRepository interface
- Database: account_recovery_tokens table
- Migration: Create account_recovery_tokens table
- Infrastructure: DrizzleAccountRecoveryTokenRepository
- Infrastructure: InMemoryAccountRecoveryTokenRepository
- Application: StartRecoveryCommand
- Application: StartRecoveryHandler
- Application: CompleteRecoveryCommand
- Application: CompleteRecoveryHandler
- Security: Assurance level definition
- Security: Recovery must not bypass MFA
- Events: RECOVERY_STARTED, RECOVERY_COMPLETED

**Database Invariants**:
```sql
UNIQUE (token_digest) WHERE consumed_at IS NULL
```

---

### 8. Account Linking Hardening (PHASE 9.15.4)
**Status**: PARTIAL (exists, needs security hardening)

**Components Required**:
- Verify existing LinkSocialAccountHandler
- Add: Fresh authentication / step-up requirement
- Add: State validation
- Add: PKCE validation (if applicable)
- Add: Nonce validation (if applicable)
- Add: Issuer validation
- Add: Audience validation
- Add: External identity ownership check (atomic)
- Database: Verify UNIQUE constraint on (provider, provider_subject)
- Security: Concurrent linking test
- Security: Attack matrix tests
- Events: ACCOUNT_LINK_STARTED, ACCOUNT_LINK_COMPLETED, ACCOUNT_LINK_REJECTED

**Database Invariants**:
```sql
UNIQUE (provider, provider_subject)
```

**Concurrency Proof Required**:
- Test: N concurrent link attempts for same external identity
- Expected: Exactly 1 canonical owner
- Method: Transaction with INSERT ... ON CONFLICT DO NOTHING

---

### 9. Token Revocation (PHASE 9.15.9)
**Status**: NOT STARTED

**Components Required**:
- Domain: TokenBlacklist entity
- Domain: TokenBlacklistRepository interface
- Database: token_blacklist table
- Migration: Create token_blacklist table
- Infrastructure: DrizzleTokenBlacklistRepository
- Infrastructure: InMemoryTokenBlacklistRepository
- Application: RevokeTokenCommand
- Application: RevokeTokenHandler
- Security: Refresh token reuse detection
- Security: Token family management
- Events: REFRESH_TOKEN_REUSE_DETECTED, SESSION_REVOKED

**Database Invariants**:
```sql
UNIQUE (token_digest)
```

---

## Implementation Standards

### Security Standards
1. All tokens must be cryptographically random (minimum 256 bits)
2. All tokens must be stored as digests/hashes, never raw
3. All one-time operations must be atomic at database level
4. All uniqueness constraints must be enforced by database
5. All rate limiting must be implemented
6. All enumeration risks must be mitigated
7. All secrets must never appear in logs

### Concurrency Standards
1. Every one-time operation requires PostgreSQL concurrency test
2. Every ownership-sensitive operation requires PostgreSQL concurrency test
3. Tests must use real transactions, not application-level locks only
4. Tests must prove exactly-one-success invariant

### Failure Injection Standards
1. Test failures at every layer: validation, database, transaction, external provider, event publication, session creation, response
2. Verify no partial identity state is created
3. Verify transaction rollback semantics
4. Verify recoverable state definition

### Test Standards
1. Unit tests for happy path
2. Unit tests for error paths
3. Integration tests with real PostgreSQL
4. Concurrency tests with real PostgreSQL
5. Security attack matrix tests
6. Failure injection tests

### Documentation Standards
1. Every capability must have security requirements documented
2. Every database constraint must be documented
3. Every concurrency invariant must be documented
4. Every attack test must be documented with expected/observed

---

## Current Progress

### Completed
- [x] IAM CAPABILITY MAP created
- [x] MagicLinkToken domain entity
- [x] MagicLinkTokenRepository interface
- [x] magic_link_tokens table schema with UNIQUE constraint

### In Progress
- [ ] Magic Link complete implementation (infrastructure, application, presentation, tests)

### Not Started
- [ ] Email Verification
- [ ] Password Reset
- [ ] Security Audit Events
- [ ] Session Security Policy
- [ ] MFA
- [ ] Identity Recovery
- [ ] Account Linking Hardening
- [ ] Token Revocation

---

## Next Immediate Steps

1. Complete Magic Link implementation:
   - Create migration for magic_link_tokens table
   - Implement DrizzleMagicLinkTokenRepository
   - Implement InMemoryMagicLinkTokenRepository
   - Implement SendMagicLinkCommand/Handler
   - Implement VerifyMagicLinkCommand/Handler
   - Create validators
   - Add AuthController routes
   - Implement rate limiting
   - Create concurrency test
   - Create security tests
   - Verify all invariants

2. Only after Magic Link is complete and verified, proceed to Email Verification

3. Continue sequentially through each capability

4. Final status matrix after all capabilities complete
