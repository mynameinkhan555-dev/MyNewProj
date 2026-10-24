# IAM → Identity Migration Strategy Document

**IdentityPlatform — Multi-Tenant SaaS Migration**

---

## 1. Executive Summary

### 1.1 Nega Migratsiya Kerak?

**Migratsiya sabablari:**

1. **Identity-Centric Architecture (maqsad)**
   - AI agent tavsiyasi: "Identity-centric Multi-SaaS uchun yaxshi"
   - Qaror qabul qilingan: IAM → Identity migratsiyasi
   - Maqsad: 100+ kompaniyaga xizmat qiladigan platforma

2. **DDD Aggregate Separation (arxitektura)**
   - IAM: Combined identities table (email, password, display_name birga)
   - Identity: Separated aggregates (User, EmailIdentity, ExternalIdentity, PasswordCredential, Session)
   - DDD tamoyiliga mos

3. **Multi-Tenancy (biznes)**
   - IAM: Global roles/permissions + tenant extensions
   - Identity: Tenant-scoped roles + PLATFORM/TENANT permission scopes
   - 100+ kompaniyaga xizmat qilish uchun yaxshi

4. **Session Security (xavfsizlik)**
   - IAM: Plaintext refresh_token (CRITICAL vulnerability)
   - Identity: Hashed refresh_token_hash
   - Migratsiya orqali xavfsizlikni yaxshilash

### 1.2 Maqsadli Arxitektura

**Identity Module:**
```
User (canonical global aggregate)
  ├── EmailIdentity (separate aggregate)
  ├── ExternalIdentity (separate aggregate)
  ├── PasswordCredential (separate aggregate)
  └── Session (separate aggregate)
```

**Tenant Module:**
```
Tenant (aggregate)
  └── Membership (aggregate)
```

**Access Control Module:**
```
Permission (entity)
  ├── TenantRole (entity)
  ├── RolePermission (entity)
  └── RoleAssignment (aggregate)
```

### 1.3 Migratsiya Tamoyillari

1. **INCREMENTAL** — Bosqichma-bosqich
2. **DUAL-WRITE** — Ikki parallel schema bo'ylab yozish
3. **VERIFICATION** — Har bir bosqichni tekshirish
4. **ROLLBACK** — Har doim rollback mumkin
5. **SECURITY-FIRST** — Xavfsizlik birinchi o'rinda
6. **ZERO-DOWNTIME** — Maqsad: foydalanuvchiga sezilmaydigan migratsiya

---

## 2. Current State Analysis

### 2.1 IAM: Nima Bor, Nima Ishlaydi

**Domain Layer:**
- `User` entity (combined: email, password, display_name, status)
- `Role` entity (global)
- `Permission` entity (global)
- `Policy` entity (ABAC)
- `SocialIdentity` entity (OAuth/social)

**Application Layer:**
- ✅ RegisterUserHandler
- ✅ LoginUserHandler
- ✅ LogoutUserHandler
- ✅ ChangePasswordHandler
- ✅ SetInitialPasswordHandler
- ✅ AssignRoleHandler
- ✅ OAuthLoginHandler (Google, GitHub, Telegram)
- ✅ LinkSocialAccountHandler
- ✅ InitiateOAuthHandler
- ✅ SendMagicLinkHandler
- ✅ VerifyMagicLinkHandler
- ✅ PolicyService (ABAC)
- ✅ AuthService

**Infrastructure Layer:**
- ✅ DrizzleUserRepository
- ✅ DrizzleRoleRepository
- ✅ DrizzleSessionRepository
- ✅ DrizzleSocialIdentityRepository
- ✅ DrizzlePolicyRepository
- ✅ DrizzleOAuthStateRepository
- ✅ DrizzleOutboxRepository
- ✅ DrizzleMagicLinkTokenRepository
- ✅ BcryptPasswordHasher
- ✅ IamJwtService
- ✅ GoogleOAuthProvider, GitHubOAuthProvider, TelegramOAuthProvider

**Presentation Layer:**
- ✅ AuthController
- ✅ OAuthController
- ✅ UserController
- ✅ RoleController
- ✅ PermissionController
- ✅ PolicyController
- ✅ AuthGuard, RoleGuard, PermissionGuard

**Database Schema (13 migrations):**
- ✅ identities (combined user table)
- ✅ iam_sessions (plaintext refresh_token)
- ✅ iam_roles (global)
- ✅ iam_permissions (global)
- ✅ iam_identity_roles
- ✅ iam_role_permissions
- ✅ social_identities
- ✅ iam_policies (ABAC)
- ✅ oauth_states
- ✅ magicLinkTokens
- ✅ iam_devices
- ✅ tenants (added in 0007)
- ✅ tenant_memberships (added in 0008)
- ✅ tenant_roles (added in 0009)
- ✅ role_assignments (added in 0010)
- ✅ invitations (added in 0011)

**Runtime Status:**
- ✅ apps/api imports ONLY from @workspace/iam
- ✅ Runtime-active
- ✅ Production database uses IAM schema

**Security Vulnerability:**
- ❌ **CRITICAL**: iam_sessions.refresh_token is PLAINTEXT

---

### 2.2 Identity: Nima Bor, Nima Tugallangan

**Domain Layer:**
- ✅ User aggregate (canonical global, status only)
- ✅ EmailIdentity aggregate (email per user, verification state)
- ✅ ExternalIdentity aggregate (OAuth/social per user)
- ✅ PasswordCredential aggregate (password per user)
- ✅ Session aggregate (session per user)
- ✅ Domain events for all aggregates
- ✅ Repository ports (interfaces)

**Infrastructure Layer:**
- ✅ users.table.ts (schema)
- ✅ email_identities.table.ts (schema)
- ✅ external_identities.table.ts (schema)
- ✅ password_credentials.table.ts (schema)
- ✅ sessions.table.ts (schema, HASHED refresh_token)
- ✅ user.repository.ts (DrizzleUserRepository)
- ✅ user.mapper.ts
- ✅ user.repository.integration.test.ts (14/14 passing, qualified)
- ❌ EmailIdentityRepository (interface only)
- ❌ ExternalIdentityRepository (interface only)
- ❌ PasswordCredentialRepository (interface only)
- ❌ SessionRepository (interface only)

**Application Layer:**
- ❌ DOES NOT EXIST

**Presentation Layer:**
- ❌ DOES NOT EXIST

**Database Schema (4 migrations - UNTRACKED):**
- ✅ 0000_identity.sql (users, email_identities, external_identities, password_credentials, sessions)
- ✅ 0001_tenant.sql (tenants, memberships)
- ✅ 0002_authorization.sql (permissions, tenant_roles, role_assignments, role_permissions)
- ✅ 0003_outbox.sql (outbox)

**Runtime Status:**
- ❌ NOT connected to runtime
- ❌ apps/api does NOT import @workspace/identity
- ❌ Production database does NOT use Identity schema

**Test Status:**
- ✅ Domain tests (all passing)
- ✅ UserRepository integration tests (14/14 passing, qualified)
- ❌ Other repository integration tests (not implemented)

---

### 2.3 Farqlar

| Aspect | IAM | Identity | Difference |
|--------|-----|----------|------------|
| **User Model** | Combined identities table | Separated aggregates | DDD separation |
| **Email** | Column in identities | Separate EmailIdentity table | Aggregate separation |
| **Password** | Column in identities | Separate PasswordCredential table | Aggregate separation |
| **Session Token** | PLAINTEXT (CRITICAL) | HASHED | Security improvement |
| **Device Binding** | device_id, device_name, device_type, ip_address, user_agent | NONE | Regression |
| **Roles** | Global + tenant-scoped | Tenant-scoped only | Authorization model change |
| **Permissions** | Global | TENANT or PLATFORM scope | Authorization model change |
| **Role Assignment** | identity_id → role_id | membership_id → role_id | Through membership |
| **ABAC** | iam_policies | Not designed | Feature loss |
| **OAuth Tokens** | Stored in social_identities | Not designed | Feature loss |
| **ID Type** | TEXT | UUID | Type change |

---

## 3. Data Mapping

### 3.1 identities → users + email_identities + password_credentials

**Source (IAM):**
```sql
identities (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  status identity_status,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Target (Identity):**
```sql
users (
  id UUID PRIMARY KEY,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

email_identities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  verified_at TIMESTAMP,
  primary BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

password_credentials (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Transformation:**
```
identities.id → users.id (TEXT → UUID, generate new UUID)
identities.status → users.status (identity_status → UserStatus)
identities.created_at → users.created_at
identities.updated_at → users.updated_at

identities.id → email_identities.user_id (TEXT → UUID, use generated UUID)
identities.email → email_identities.email
identities.avatar_url → NULL (not supported in target)
identities.email → email_identities.primary = true (make primary)
identities.status = 'unverified' → email_identities.verified_at = NULL
identities.status = 'active' → email_identities.verified_at = created_at
identities.status = 'suspended' → email_identities.verified_at = created_at

identities.id → password_credentials.user_id (TEXT → UUID, use generated UUID)
identities.password_hash → password_credentials.hashed_password
identities.created_at → password_credentials.created_at
identities.updated_at → password_credentials.updated_at
```

**Risk:** HIGH
- Data loss: display_name, avatar_url
- ID type change: TEXT → UUID
- Foreign key chain complexity
- One row → three rows

**Mitigation:**
- Store mapping: identities.id → users.id (TEXT to UUID)
- Preserve display_name in migration audit table
- Generate UUIDs deterministically or store mapping
- Verify password hashes after migration

---

### 3.2 iam_sessions → sessions

**Source (IAM):**
```sql
iam_sessions (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  device_id TEXT,
  device_name TEXT,
  device_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  refresh_token TEXT NOT NULL UNIQUE,  -- PLAINTEXT
  expires_at TIMESTAMP,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP
)
```

**Target (Identity):**
```sql
sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  refresh_token_hash TEXT NOT NULL,  -- HASHED
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Transformation:**
```
iam_sessions.id → sessions.id (TEXT → UUID, generate new UUID)
iam_sessions.identity_id → sessions.user_id (TEXT → UUID, use mapping from users table)
iam_sessions.refresh_token → sessions.refresh_token_hash (HASH during migration)
iam_sessions.expires_at → sessions.expires_at
iam_sessions.created_at → sessions.created_at
iam_sessions.last_active_at → sessions.updated_at

iam_sessions.device_id → NULL (not supported)
iam_sessions.device_name → NULL (not supported)
iam_sessions.device_type → NULL (not supported)
iam_sessions.ip_address → NULL (not supported)
iam_sessions.user_agent → NULL (not supported)
```

**CRITICAL:** All active sessions must be invalidated during migration because:
- Tokens must be hashed (cannot reverse hash)
- Device binding fields lost
- Users must re-authenticate

**Risk:** CRITICAL
- All active sessions invalidated (user experience impact)
- Device binding regression
- Token hashing must be correct

**Mitigation:**
- Communicate to users in advance
- Schedule migration during low-traffic window
- Hash tokens using same algorithm as Identity
- Verify hashing process in dry-run
- Add device binding fields to Identity schema BEFORE migration

---

### 3.3 social_identities → external_identities

**Source (IAM):**
```sql
social_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,
  provider_display_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Target (Identity):**
```sql
external_identities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  identity_verified_at TIMESTAMP,
  provider_email TEXT,
  provider_email_verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Transformation:**
```
social_identities.id → external_identities.id (TEXT → UUID)
social_identities.user_id → external_identities.user_id (TEXT → UUID, use mapping)
social_identities.provider → external_identities.provider
social_identities.provider_user_id → external_identities.provider_subject
social_identities.provider_email → external_identities.provider_email
social_identities.provider_email_verified → external_identities.provider_email_verified (if available)
social_identities.created_at → external_identities.created_at
social_identities.updated_at → external_identities.updated_at

social_identities.provider_display_name → NULL (not supported)
social_identities.access_token → NULL (not supported)
social_identities.refresh_token → NULL (not supported)
social_identities.token_expires_at → NULL (not supported)
```

**Risk:** MEDIUM
- OAuth tokens lost (users must re-link accounts)
- Provider display name lost
- ID type change

**Mitigation:**
- Inform users that OAuth accounts need re-linking
- Store OAuth tokens in migration audit table (if needed)
- Consider adding OAuth token storage to Identity schema

---

### 3.4 tenant_memberships → memberships

**Source (IAM):**
```sql
tenant_memberships (
  id TEXT PRIMARY KEY,
  identity_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  status membership_status,
  joined_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Target (Identity):**
```sql
memberships (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  status TEXT,
  joined_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Transformation:**
```
tenant_memberships.id → memberships.id (TEXT → UUID)
tenant_memberships.identity_id → memberships.user_id (TEXT → UUID, use mapping)
tenant_memberships.tenant_id → memberships.tenant_id (TEXT → UUID)
tenant_memberships.status → memberships.status
tenant_memberships.joined_at → memberships.joined_at
tenant_memberships.created_at → memberships.created_at
tenant_memberships.updated_at → memberships.updated_at
```

**Risk:** MEDIUM
- ID type change
- FK change (identity_id → user_id)
- Status enum mapping

**Mitigation:**
- Use mapping from identities → users
- Verify membership count after migration
- Verify tenant isolation after migration

---

### 3.5 iam_roles → tenant_roles

**Source (IAM):**
```sql
iam_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN
)

tenant_roles (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT,
  description TEXT
)
```

**Target (Identity):**
```sql
tenant_roles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  status TEXT
)
```

**Transformation:**
```
iam_roles → TWO STRATEGIES:

STRATEGY A: Convert global roles to PLATFORM permissions
- iam_roles → permissions with scope = 'PLATFORM'
- Role → Permission semantics change

STRATEGY B: Create default tenant for global roles
- iam_roles → tenant_roles with tenant_id = DEFAULT_TENANT_ID
- Keep role semantics

STRATEGY C: Delete global roles (if not used)
- iam_roles → DROP (if no global role assignments)
```

**Risk:** HIGH
- Authorization model change
- Global role semantics may not map to tenant-scoped model
- Privilege escalation risk if mapping incorrect
- Access denial risk if mapping incorrect

**Mitigation:**
- Analyze role usage before migration
- Determine which strategy to use
- Test authorization after migration
- May need to preserve global roles as PLATFORM permissions

---

### 3.6 iam_permissions → permissions

**Source (IAM):**
```sql
iam_permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT
)
```

**Target (Identity):**
```sql
permissions (
  id UUID PRIMARY KEY,
  key TEXT NOT NULL,
  scope TEXT NOT NULL,  -- TENANT or PLATFORM
  display_name TEXT,
  description TEXT,
  metadata JSONB,
  status TEXT
)
```

**Transformation:**
```
iam_permissions → permissions

iam_permissions.name → permissions.key
iam_permissions.description → permissions.description
iam_permissions.name → permissions.display_name
permissions.scope = 'PLATFORM' (for global permissions)
permissions.status = 'ACTIVE'
```

**Risk:** MEDIUM
- Permission name → key field change
- Scope addition (must decide PLATFORM vs TENANT)

**Mitigation:**
- Determine which permissions are global (PLATFORM scope)
- Map tenant-specific permissions appropriately
- Test permission checks after migration

---

### 3.7 iam_policies → ? (ABAC kelajagi)

**Source (IAM):**
```sql
iam_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  effect TEXT,
  subjects JSONB,
  resources JSONB,
  actions JSONB,
  conditions JSONB,
  priority INTEGER,
  is_active BOOLEAN,
  created_by TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Target (Identity):**
```
NOT DESIGNED - ABAC not in Identity architecture
```

**Transformation:**
```
OPTION A: Preserve ABAC
- Add iam_policies table to Identity schema
- Keep ABAC support

OPTION B: Drop ABAC
- Export policies for reference
- Migrate to RBAC only
- Accept feature loss
```

**Risk:** HIGH (if dropped)
- Loss of ABAC capability
- Authorization regression
- May not meet business requirements

**Mitigation:**
- Determine if ABAC is required for 100+ SaaS
- If required, add ABAC to Identity schema
- If not required, document decision and accept loss

---

## 4. Migration Phases

### Phase 0: Tayyorgarlik (Preparation)

**Nima qilinadi:**
1. Full database backup
2. Snapshot migration audit table creation
3. Migration script development
4. Dry-run migration on staging
5. Rollback script development
6. Monitoring setup
7. Communication plan preparation

**Qanday test qilinadi:**
- Dry-run migration script
- Data integrity verification
- Row count verification
- Foreign key verification

**Rollback:**
- Restore from backup

**Estimated vaqt:** 1-2 weeks

---

### Phase 1: Schema Migration (New Tables)

**Nima qilinadi:**
1. Add Identity schema migrations to production
2. Execute migrations (0000_identity, 0001_tenant, 0002_authorization, 0003_outbox)
3. Add device binding fields to sessions table (before data migration)
4. Add ABAC support table if required (iam_policies equivalent)
5. Verify new tables created

**Qanday test qilinadi:**
- Verify all tables created
- Verify foreign keys
- Verify indexes
- Verify constraints

**Rollback:**
- Drop new tables
- Revert migrations

**Estimated vaqt:** 1 day

---

### Phase 2: Data Migration (Batch)

**Nima qilinadi:**
1. Create migration audit table (stores mapping: identities.id → users.id)
2. Migrate identities → users + email_identities + password_credentials
3. Migrate iam_sessions → sessions (with token hashing)
4. Migrate social_identities → external_identities
5. Migrate tenant_memberships → memberships
6. Migrate iam_roles → tenant_roles (decide strategy)
7. Migrate iam_permissions → permissions
8. Preserve iam_policies if ABAC required
9. Verify data integrity
10. Verify row counts

**Qanday test qilinadi:**
- Compare row counts before/after
- Verify foreign key integrity
- Verify password hashes (bcrypt verify)
- Verify token hashes
- Sample verification of migrated data
- Authorization verification

**Rollback:**
- Drop new tables
- Restore from backup
- Revert Phase 1

**Estimated vaqt:** 3-5 days

---

### Phase 3: Dual-Write (IAM + Identity)

**Nima qilinadi:**
1. Implement Identity application layer (use cases, handlers)
2. Implement Identity presentation layer (controllers, middleware)
3. Implement dual-write in IAM handlers:
   - Write to IAM schema (existing)
   - Write to Identity schema (new)
4. Deploy dual-write version
5. Monitor dual-write consistency
6. Verify data parity between schemas

**Qanday test qilinadi:**
- Dual-write verification tests
- Data parity checks
- Integration tests for both schemas
- E2E tests

**Rollback:**
- Disable dual-write
- Remove dual-write code
- Continue using IAM only

**Estimated vaqt:** 2-3 weeks

---

### Phase 4: Read Cutover (Identity Read)

**Nima qilinadi:**
1. Configure apps/api to read from Identity schema
2. Keep writing to both schemas (dual-write)
3. Verify read operations work correctly
4. Monitor for errors
5. Performance verification

**Qanday test qilinadi:**
- Read operation tests
- Authorization tests
- Session tests
- E2E tests

**Rollback:**
- Revert read configuration to IAM
- Continue dual-write

**Estimated vaqt:** 3-5 days

---

### Phase 5: Write Cutover (Identity Write)

**Nima qilinadi:**
1. Configure apps/api to write to Identity schema only
2. Disable dual-write
3. Remove IAM write code
4. Verify write operations work correctly
5. Monitor for errors
6. Verify data consistency

**Qanday test qilinadi:**
- Write operation tests
- Integration tests
- E2E tests
- Authorization tests

**Rollback:**
- Re-enable dual-write
- Revert to IAM write

**Estimated vaqt:** 3-5 days

---

### Phase 6: IAM Removal

**Nima qilinadi:**
1. Remove IAM tables from database
2. Remove IAM module from codebase
3. Remove IAM dependencies
4. Clean up IAM migrations
5. Verify cleanup

**Qanday test qilinadi:**
- Verify IAM tables dropped
- Verify IAM code removed
- Verify no IAM imports remain
- Full integration tests

**Rollback:**
- NOT POSSIBLE (destructive operation)
- Must be final step

**Estimated vaqt:** 1-2 days

---

## 5. Security Considerations

### 5.1 Plaintext Token → Hashed Token Migration

**Problem:**
- IAM stores refresh_token as PLAINTEXT in iam_sessions
- Identity stores refresh_token_hash as HASHED in sessions
- Migration must hash all existing tokens

**Solution:**
1. Use same hashing algorithm as Identity (likely bcrypt)
2. Hash all existing refresh_tokens during data migration
3. **CRITICAL:** All active sessions will be invalidated (cannot reverse hash)
4. Users must re-authenticate after migration

**Mitigation:**
- Communicate to users in advance
- Schedule migration during low-traffic window
- Provide clear instructions for re-authentication

---

### 5.2 Session Invalidation

**Problem:**
- All active sessions will be invalidated during token hashing
- Users will be logged out

**Solution:**
1. Notify users in advance (email, in-app notification)
2. Schedule migration during planned maintenance window
3. Provide grace period for re-authentication

**Mitigation:**
- Communicate clearly
- Schedule at low-traffic time
- Monitor for support tickets

---

### 5.3 Password Hash Preservation

**Problem:**
- Password hashes must be preserved exactly
- If hashes corrupted, users cannot log in

**Solution:**
1. Copy password_hash as-is (no re-hashing)
2. Verify bcrypt hashes after migration (bcrypt.compare)
3. Store original hash in migration audit table

**Mitigation:**
- Verify hash preservation in dry-run
- Test login with migrated hashes
- Keep audit table for rollback

---

### 5.4 OAuth Token Handling

**Problem:**
- IAM stores OAuth tokens (access_token, refresh_token) in social_identities
- Identity does NOT have OAuth token storage
- OAuth tokens will be lost

**Solution:**
1. Inform users that OAuth accounts need re-linking
2. Consider adding OAuth token storage to Identity schema
3. Store OAuth tokens in migration audit table (if needed)

**Mitigation:**
- Communicate OAuth re-linking requirement
- Consider adding OAuth token storage to Identity before migration

---

### 5.5 Audit Trail

**Problem:**
- Migration must be auditable
- Must be able to trace data changes

**Solution:**
1. Create migration_audit table
2. Log all data transformations
3. Store original and new IDs
4. Log migration timestamp
5. Log migration operator

**Mitigation:**
- Audit table available for verification
- Audit table available for rollback

---

## 6. Risk Analysis

### 6.1 Data Loss Risk

**Likelihood:** MEDIUM
**Impact:** CRITICAL
**Mitigation:**
- Full database backup before migration
- Migration audit table
- Dry-run migration
- Row count verification
- Sample data verification

---

### 6.2 Authorization Breakage Risk

**Likelihood:** HIGH
**Impact:** CRITICAL
**Mitigation:**
- Analyze role/permission usage before migration
- Test authorization after migration
- Preserve ABAC if required
- Incremental cutover (read first, then write)
- Rollback capability at each phase

---

### 6.3 Downtime Risk

**Likelihood:** MEDIUM
**Impact:** HIGH
**Mitigation:**
- Dual-write phase (no downtime)
- Read cutover (no downtime)
- Write cutover (minimal downtime)
- Scheduled maintenance window
- Graceful degradation

---

### 6.4 Rollback Complexity

**Likelihood:** LOW (if rollback planned)
**Impact:** HIGH (if rollback needed)
**Mitigation:**
- Rollback script for each phase
- Database backup
- Phase-based rollback (can rollback to any phase)
- Dry-run rollback

---

### 6.5 OAuth Token Loss Risk

**Likelihood:** HIGH
**Impact:** MEDIUM
**Mitigation:**
- Communicate OAuth re-linking requirement
- Consider adding OAuth token storage to Identity
- Store OAuth tokens in audit table

---

### 6.6 Device Binding Regression Risk

**Likelihood:** HIGH
**Impact:** MEDIUM
**Mitigation:**
- Add device binding fields to Identity schema BEFORE migration
- Copy device binding data during migration
- Preserve device binding in target schema

---

## 7. Feature Parity Check

### 7.1 IAMda Bor, Identityda Yo'q Funksiyalar

| Feature | IAM Status | Identity Status | Qachon Implement Qilinadi |
|---------|-----------|----------------|---------------------------|
| **Magic Link** | ✅ Implemented | ❌ Not implemented | Phase 3 (before write cutover) |
| **MFA** | ⚠️ Migration exists, implementation not verified | ❌ Not implemented | Phase 3 (before write cutover) |
| **ABAC** | ✅ Implemented (iam_policies) | ❌ Not designed | Phase 1 (schema migration) |
| **Device Binding** | ✅ Implemented | ❌ Not implemented | Phase 1 (schema migration) |
| **IP Tracking** | ✅ Implemented | ❌ Not implemented | Phase 1 (schema migration) |
| **User Agent Tracking** | ✅ Implemented | ❌ Not implemented | Phase 1 (schema migration) |
| **OAuth Token Storage** | ✅ Implemented | ❌ Not implemented | Phase 1 (schema migration) |
| **Password Reset** | ❌ Not evident | ❌ Not implemented | Phase 3 (before write cutover) |
| **Email Verification** | ❌ Not evident | ⚠️ Field exists, no implementation | Phase 3 (before write cutover) |
| **Refresh Token Rotation** | ❌ Not evident | ❌ Not implemented | Phase 3 (before write cutover) |

**Critical:** All features must be implemented BEFORE write cutover.

---

## 8. Testing Strategy

### 8.1 Dry-Run Migration

**Qachon:** Phase 0 (preparation)
**Qanday:**
- Run migration script on staging database
- Do NOT modify production
- Verify all transformations
- Verify data integrity
- Measure execution time

**Success Criteria:**
- No errors
- Row counts match
- Foreign keys valid
- Password hashes verify
- Token hashes valid

---

### 8.2 Data Integrity Verification

**Qachon:** After Phase 2 (data migration)
**Qanday:**
- Compare row counts before/after
- Verify foreign key integrity
- Verify unique constraints
- Verify check constraints
- Sample verification of migrated data

**Success Criteria:**
- Row counts match
- No orphaned records
- No constraint violations

---

### 8.3 Authorization Verification

**Qachon:** After Phase 4 (read cutover)
**Qanday:**
- Test role assignments
- Test permission checks
- Test tenant isolation
- Test ABAC (if preserved)
- Test edge cases

**Success Criteria:**
- Authorization works correctly
- No privilege escalation
- No access denial for valid users

---

### 8.4 E2E Tests

**Qachon:** After Phase 5 (write cutover)
**Qanday:**
- Full user registration flow
- Full login flow
- Full OAuth flow
- Full session management
- Full authorization flow
- Full tenant management

**Success Criteria:**
- All E2E tests pass
- No errors in production logs
- No support tickets spike

---

## 9. Cutover Plan

### 9.1 Qachon Cutover

**Recommended:** Weekend night (low-traffic window)
**Time:** 2:00 AM - 6:00 AM local time
**Communication:** 1 week in advance

---

### 9.2 Qanday Cutover

**Strategy:** Gradual (dual-write → read cutover → write cutover)

**Rationale:**
- Dual-write: No downtime
- Read cutover: No downtime
- Write cutover: Minimal downtime (5-10 minutes)

**Big Bang:** NOT RECOMMENDED
- Too risky
- Too much downtime
- Harder to rollback

---

### 9.3 Downtime Window

**Expected Downtime:** 5-10 minutes (write cutover only)
**Communication:** Maintenance notification 1 week in advance

---

### 9.4 Communication Plan

**1 Week Before:**
- Email to all users
- In-app notification
- Expected downtime
- OAuth re-linking requirement
- Session invalidation explanation

**1 Day Before:**
- Reminder notification
- Final downtime confirmation

**Day Of:**
- Maintenance mode banner
- Progress updates

**After:**
- Migration complete notification
- OAuth re-linking instructions
- Support contact

---

## 10. Rollback Plan

### 10.1 Qachon Rollback

**Rollback Triggers:**
- Data integrity verification fails
- Authorization verification fails
- E2E tests fail
- Critical errors in production
- Support ticket spike

---

### 10.2 Qanday Rollback

**Phase 0 Rollback:**
- N/A (no changes made)

**Phase 1 Rollback:**
- Drop new tables
- Revert migrations

**Phase 2 Rollback:**
- Drop new tables
- Restore from backup
- Revert Phase 1

**Phase 3 Rollback:**
- Disable dual-write
- Remove dual-write code
- Continue using IAM only

**Phase 4 Rollback:**
- Revert read configuration to IAM
- Continue dual-write

**Phase 5 Rollback:**
- Re-enable dual-write
- Revert to IAM write

**Phase 6 Rollback:**
- NOT POSSIBLE (destructive)

---

### 10.3 Rollback Complexity

**Phase 0-5:** LOW (planned rollback available)
**Phase 6:** IMPOSSIBLE (destructive operation)

**Mitigation:**
- Do not proceed to Phase 6 until all verifications pass
- Phase 6 must be final step

---

## 11. Timeline

### 11.1 Estimated Timeline

| Phase | Estimated Vaqt | Dependencies |
|-------|---------------|--------------|
| Phase 0: Tayyorgarlik | 1-2 weeks | None |
| Phase 1: Schema Migration | 1 day | Phase 0 |
| Phase 2: Data Migration | 3-5 days | Phase 1 |
| Phase 3: Dual-Write | 2-3 weeks | Phase 2 |
| Phase 4: Read Cutover | 3-5 days | Phase 3 |
| Phase 5: Write Cutover | 3-5 days | Phase 4 |
| Phase 6: IAM Removal | 1-2 days | Phase 5 |

**Total:** 6-10 weeks

---

### 11.2 Critical Path

1. Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
2. Cannot skip phases
3. Each phase must be verified before proceeding

---

## 12. Open Questions

### QUESTION-001: ABAC Preservation

**Savol:** ABAC (iam_policies) ni saqlab qolishmi yoki tashlab ketishmi?

**Context:**
- IAM has ABAC support (iam_policies)
- Identity does NOT have ABAC design
- 100+ SaaS platform may require ABAC

**Options:**
A. Preserve ABAC (add iam_policies equivalent to Identity schema)
B. Drop ABAC (migrate to RBAC only)
C. Defer ABAC (implement later)

**Requires:** Business decision

---

### QUESTION-002: Global Roles Strategy

**Savol:** Global iam_roles qanday migratsiya qilinadi?

**Context:**
- IAM has global roles (iam_roles)
- Identity has tenant-scoped roles only (tenant_roles)
- Authorization model differs

**Options:**
A. Convert to PLATFORM permissions
B. Create default tenant for global roles
C. Delete global roles (if not used)

**Requires:** Business decision + usage analysis

---

### QUESTION-003: OAuth Token Storage

**Savol:** OAuth tokenlarni saqlab qolishmi yoki tashlab ketishmi?

**Context:**
- IAM stores OAuth tokens in social_identities
- Identity does NOT have OAuth token storage
- OAuth tokens will be lost

**Options:**
A. Add OAuth token storage to Identity schema
B. Drop OAuth tokens (users must re-link)
C. Store in audit table only

**Requires:** Business decision

---

### QUESTION-004: Device Binding Addition

**Savol:** Device binding fieldlarini Identity sessions ga qo'shamizmi?

**Context:**
- IAM has device binding (device_id, device_name, device_type, ip_address, user_agent)
- Identity does NOT have device binding
- Device binding regression

**Options:**
A. Add device binding fields to Identity schema BEFORE migration
B. Accept device binding loss
C. Add device binding AFTER migration

**Requires:** Business decision

---

### QUESTION-005: Cutover Timing

**Savol:** Qachon cutover qilamiz?

**Context:**
- 6-10 weeks migration timeline
- Business priorities may require sooner or later cutover

**Options:**
A. Weekday night (moderate traffic)
B. Weekend night (low traffic)
C. Holiday (lowest traffic)

**Requires:** Business decision

---

## 13. Final Recommendations

### 13.1 Immediate Actions

1. **Complete Phase 6W Step 2B** — UserRepository reference qualification
2. **Implement remaining 10 repositories** — Using proven pattern
3. **Implement Identity application layer** — Use cases, handlers
4. **Implement Identity presentation layer** — Controllers, middleware
5. **Add device binding to Identity schema** — Before migration
6. **Add OAuth token storage to Identity schema** — Before migration
7. **Decide ABAC preservation** — Business decision required
8. **Decide global roles strategy** — Business decision required

### 13.2 Migration Execution

1. **Phase 0** — Preparation (backup, dry-run)
2. **Phase 1** — Schema migration
3. **Phase 2** — Data migration
4. **Phase 3** — Dual-write
5. **Phase 4** — Read cutover
6. **Phase 5** — Write cutover
7. **Phase 6** — IAM removal

### 13.3 Critical Success Factors

1. **Feature parity** — All IAM features in Identity before cutover
2. **Testing** — Comprehensive testing at each phase
3. **Rollback** - Rollback capability at each phase
4. **Communication** - Clear user communication
5. **Monitoring** - Production monitoring during migration

---

## 14. Appendix: Migration Checklist

### Phase 0 Checklist
- [ ] Full database backup completed
- [ ] Migration audit table designed
- [ ] Migration script developed
- [ ] Dry-run migration on staging
- [ ] Rollback script developed
- [ ] Monitoring setup
- [ ] Communication plan prepared

### Phase 1 Checklist
- [ ] Identity schema migrations added
- [ ] Device binding fields added to sessions
- [ ] OAuth token storage added
- [ ] ABAC support added (if required)
- [ ] All tables created
- [ ] Foreign keys verified
- [ ] Indexes verified
- [ ] Constraints verified

### Phase 2 Checklist
- [ ] Migration audit table created
- [ ] identities → users + email_identities + password_credentials migrated
- [ ] iam_sessions → sessions migrated (tokens hashed)
- [ ] social_identities → external_identities migrated
- [ ] tenant_memberships → memberships migrated
- [ ] iam_roles → tenant_roles migrated
- [ ] iam_permissions → permissions migrated
- [ ] iam_policies preserved (if required)
- [ ] Row counts verified
- [ ] Foreign keys verified
- [ ] Password hashes verified
- [ ] Token hashes verified

### Phase 3 Checklist
- [ ] Identity application layer implemented
- [ ] Identity presentation layer implemented
- [ ] Dual-write implemented
- [ ] Dual-write deployed
- [ ] Dual-write monitored
- [ ] Data parity verified

### Phase 4 Checklist
- [ ] Read configuration changed to Identity
- [ ] Read operations verified
- [ ] Authorization verified
- [ ] Session management verified
- [ ] Errors monitored

### Phase 5 Checklist
- [ ] Write configuration changed to Identity
- [ ] Dual-write disabled
- [ ] IAM write code removed
- [ ] Write operations verified
- [ ] Data consistency verified
- [ ] Errors monitored

### Phase 6 Checklist
- [ ] IAM tables dropped
- [ ] IAM module removed
- [ ] IAM dependencies removed
- [ ] IAM migrations removed
- [ ] Cleanup verified
- [ ] Full integration tests pass

---

**END OF IAM → IDENTITY MIGRATION STRATEGY DOCUMENT**
