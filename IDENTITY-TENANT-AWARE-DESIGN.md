# Identity Module Tenant-Aware Refactoring - Architectural Design

## Current State

**User Aggregate:** Canonical global account
- User represents existence of an account in the platform
- Email and password are in separate aggregates (EmailIdentity, PasswordCredential)
- No tenant awareness in Identity module

**Tenant Aggregate:** Company organization
- Tenant is a root aggregate
- Membership table connects User ↔ Tenant
- Tenant context extracted from headers in middleware

## Problem

Identity operations are not tenant-aware:
- RegisterUser creates global user without tenant context
- LoginUser does not return tenant information
- JWT tokens do not include tenant claims
- Session management is not tenant-scoped

## Architectural Decision

### Option 1: User Aggregate Stays Global (RECOMMENDED)

**Principle:** One canonical global User account across all tenants

**Model:**
```
User (global) ← EmailIdentity (global) ← PasswordCredential (global)
                ↓
         UserTenantMembership (many-to-many)
                ↓
            Tenant (root aggregate)
```

**Identity → Tenant Flow:**
1. RegisterUser: Creates global user (no tenant context)
2. CreateTenant: Creates tenant with admin membership
3. InviteMember: Creates membership for existing user
4. LoginUser: Returns user + all user's memberships
5. JWT Token: Includes `userId` + `tenantId` (if tenant context active)

**Benefits:**
- One user can belong to multiple tenants
- Email uniqueness enforced globally
- Simple migration path
- User can switch between tenants

**Costs:**
- Additional UserTenantMembership table/aggregate
- Login must query memberships
- Token must include tenant context selection

### Option 2: User Aggregate Tenant-Scoped

**Principle:** Each tenant has its own User accounts

**Model:**
```
Tenant (root aggregate)
  ↓
User (tenant-scoped) ← EmailIdentity (tenant-scoped) ← PasswordCredential (tenant-scoped)
```

**Identity → Tenant Flow:**
1. RegisterUser: Must have tenant context
2. Email uniqueness enforced per-tenant
3. LoginUser: Tenant context required
4. JWT Token: Includes `userId` + `tenantId`

**Benefits:**
- Complete tenant isolation at domain level
- Simple tenant queries

**Costs:**
- One user cannot belong to multiple tenants
- Email must be re-registered per tenant
- Complex migration from global users
- Inconsistent with "canonical global account" principle

## Recommended Approach: Option 1

### Implementation Plan

#### Phase 1: UserTenantMembership Aggregate
1. Create UserTenantMembership domain aggregate
2. Create repository and persistence schema
3. Add use cases:
   - AddMembershipUseCase
   - RemoveMembershipUseCase
   - ListMembershipsUseCase

#### Phase 2: RegisterUser Tenant-Aware
1. Add optional `tenantId` to RegisterUserInput
2. If `tenantId` provided, create membership during registration
3. If not, create global user only

#### Phase 3: LoginUser Returns Memberships
1. Modify LoginUserOutput to include user's memberships
2. Query UserTenantMembership repository
3. Return tenant list in response

#### Phase 4: JWT Token Tenant Context
1. Add `tenantId` claim to JWT tokens
2. Allow tenant context selection during login
3. TenantMiddleware validates tenant membership

#### Phase 5: Session Management
1. Sessions include `userId` + `tenantId`
2. Tenant context switching without re-login
3. Tenant-aware session validation

#### Phase 6: Identity Repository Tenant Filtering
1. EmailIdentity uniqueness: global (no change)
2. User queries: can filter by tenant (optional)
3. Password credential: unchanged (user-scoped)

## Open Questions

1. **Default Tenant Behavior:** Should RegisterUser require tenant context?
   - Suggestion: Optional (global registration allowed, membership added later)

2. **Tenant Context Selection:** How does user select active tenant?
   - Suggestion: Login returns all memberships, user selects active tenant in UI

3. **Token Strategy:** Single token with tenant claim or per-tenant tokens?
   - Suggestion: Single token with `tenantId` claim, can be rotated

4. **Cross-Tenant Operations:** Can one user perform operations across multiple tenants?
   - Suggestion: No, one request = one tenant context

## Migration Strategy

1. Existing users: Add to default tenant or leave as global-only
2. Existing memberships: Preserve in UserTenantMembership
3. Email identities: Global uniqueness already enforced
4. Backward compatibility: APIs work without tenant context (gradual enforcement)

## Implementation Order

1. UserTenantMembership aggregate (high priority)
2. LoginUser returns memberships (high priority)
3. JWT tenant claim (medium priority)
4. RegisterUser optional tenant (medium priority)
5. Session tenant context (low priority)
6. Repository tenant filtering (low priority)

---

Generated: 2026-10-26
Status: Awaiting User Approval
