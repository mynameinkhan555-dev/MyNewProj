# IAM CAPABILITY MAP

## Current State Assessment

### Existing Capabilities

**Authentication**
- ✅ Password-based login (LoginUserHandler)
- ✅ OAuth/OIDC login (OAuthLoginHandler, InitiateOAuthHandler)
- ✅ Account linking (LinkSocialAccountHandler)
- ✅ Session management (Session, SessionRepository)
- ✅ Logout (LogoutUserHandler)

**Identity**
- ✅ User entity (User)
- ✅ Email credential (Email)
- ✅ Password credential (PasswordHash)
- ✅ External identities (SocialIdentity)
- ✅ OAuth providers (Google, GitHub, Telegram)

**Authorization**
- ✅ RBAC (Role, Permission, RoleRepository)
- ✅ ABAC (Policy, PolicyRepository, PolicyEvaluationContext)
- ✅ Role assignment (AssignRoleHandler)
- ✅ Permission checking (CheckPermissionHandler)

**Session**
- ✅ Session entity (Session)
- ✅ Session repository interface (SessionRepository)
- ✅ Session caching (MemorySessionCache, RedisSessionCache)

### Missing Capabilities (To Be Implemented)

**Authentication**
- ❌ Magic Link login
- ❌ Email verification
- ❌ Password reset

**Credential**
- ❌ MFA (TOTP, WebAuthn/Passkeys, Recovery Codes)
- ❌ Password recovery
- ❌ Credential replacement

**External Identity**
- ⚠️ Account linking exists but needs security hardening (PHASE 9.15.4)

**Recovery**
- ❌ Identity recovery
- ❌ Lost MFA recovery
- ❌ Session recovery

**Verification**
- ❌ Email verification challenge
- ❌ Change-email verification

**Security Events**
- ❌ Security audit event infrastructure
- ❌ Event publishing for security operations

**Session Security**
- ⚠️ Session revocation exists (logout) but needs policy definition
- ❌ Token revocation / reuse detection
- ❌ Session rotation policy
- ❌ Refresh token family management

**Authorization**
- ✅ Tenant membership (exists but needs verification)

---

## Canonical Identity Model

### Invariant Definition

```
                 ┌── Password Credential
                 │
                 ├── Google Identity
                 │
Canonical User ──┼── GitHub Identity
                 │
                 ├── Telegram Identity
                 │
                 ├── Magic Link Identity/Recovery
                 │
                 └── MFA Authenticators
```

### Required Invariants

1. **User.id is canonical identity**
   - All credentials reference User.id
   - All external identities reference User.id
   - All authenticators reference User.id
   - All sessions reference User.id
   - All recovery operations reference User.id
   - All verification operations reference User.id

2. **External identity uniqueness**
   - (provider, provider_subject) → at most one canonical user
   - Enforced by database UNIQUE constraint
   - Atomic ownership transfer not allowed

3. **Credential ownership**
   - One user can have multiple credentials
   - Credential type is scoped to user
   - Primary credential policy must be explicit

4. **Authenticator ownership**
   - One user can have multiple authenticators
   - Authenticator type is scoped to user
   - Recovery codes are single-use

---

## Database Invariants

### Required Constraints

```sql
-- External identity uniqueness
UNIQUE (provider, provider_subject)

-- Active magic link token uniqueness
UNIQUE (token_digest) WHERE consumed_at IS NULL

-- Active recovery token uniqueness
UNIQUE (token_digest) WHERE consumed_at IS NULL

-- Authenticator uniqueness per user
UNIQUE (user_id, authenticator_type, authenticator_identifier)

-- Email verification uniqueness
UNIQUE (email, token_digest) WHERE verified_at IS NULL
```

---

## Capability Implementation Priority

### Phase 1: Core Authentication Augmentation
1. Magic Link (PHASE 9.15.3)
2. Email Verification (PHASE 9.15.8)
3. Password Reset (PHASE 9.15.7)

### Phase 2: Security Infrastructure
4. Security Audit Events (PHASE 9.15.10)
5. Session Security Policy (PHASE 9.15.9)
6. Token Revocation (PHASE 9.15.9)

### Phase 3: Advanced Security
7. MFA (PHASE 9.15.5)
8. Identity Recovery (PHASE 9.15.6)
9. Account Linking Hardening (PHASE 9.15.4)

---

## Concurrency Requirements

Every one-time or ownership-sensitive operation requires concurrency proof:

- Magic Link: N concurrent consumers → exactly 1 success
- Recovery Token: N concurrent consumers → exactly 1 success
- MFA Recovery Code: N concurrent consumers → exactly 1 success
- Account Linking: N concurrent link attempts → exactly 1 canonical owner
- Identity Creation: N concurrent OAuth callbacks → no duplicate external identity ownership
- Session Rotation: N concurrent refresh requests → correct rotation/reuse semantics

---

## Security Attack Matrix

### Attack Vectors to Test

| Attack Type | Target Capability | Status |
|-------------|-------------------|--------|
| Replay | Magic Link | NOT TESTED |
| Replay | Recovery Token | NOT TESTED |
| Replay | MFA Recovery Code | NOT TESTED |
| Race Condition | Magic Link Consumption | NOT TESTED |
| Race Condition | Account Linking | NOT TESTED |
| Race Condition | Identity Creation | NOT TESTED |
| Brute Force | Password Reset | NOT TESTED |
| Brute Force | Magic Link | NOT TESTED |
| Enumeration | Magic Link | NOT TESTED |
| Enumeration | Password Reset | NOT TESTED |
| Enumeration | Email Verification | NOT TESTED |
| CSRF | Login CSRF | NOT TESTED |
| Session Fixation | Session Management | NOT TESTED |
| Session Swapping | Account Linking | NOT TESTED |
| Token Substitution | Token Revocation | NOT TESTED |
| Token Confusion | Refresh Token | NOT TESTED |
| Purpose Confusion | Recovery Tokens | NOT TESTED |
| Identity Confusion | Account Linking | NOT TESTED |
| Account Takeover | Account Linking | NOT TESTED |
| Privilege Escalation | Role Assignment | NOT TESTED |
| Cross-Tenant Access | Authorization | NOT TESTED |
| Duplicate Ownership | External Identity | NOT TESTED |
| Concurrent Ownership | External Identity | NOT TESTED |
| Stale Credential | Session Revocation | NOT TESTED |
| Revoked Credential Reuse | Token Reuse | NOT TESTED |

---

## Next Steps

1. Implement Magic Link (PHASE 9.15.3)
2. Implement Email Verification (PHASE 9.15.8)
3. Implement Password Reset (PHASE 9.15.7)
4. Implement Security Audit Events (PHASE 9.15.10)
5. Implement Session Security Policy (PHASE 9.15.9)
6. Implement MFA (PHASE 9.15.5)
7. Implement Identity Recovery (PHASE 9.15.6)
8. Harden Account Linking (PHASE 9.15.4)
9. Implement Token Revocation (PHASE 9.15.9)
10. Create comprehensive security/concurrency test suite
11. Perform failure injection testing
12. Verify all invariants with real PostgreSQL
13. Document final status matrix
