# Access Control Blueprint V2

**IdentityPlatform — Multi-Model Authorization Architecture (Enhanced)**

---

## 1. Executive Summary

### 1.1 Purpose

Bu blueprint **IdentityPlatform** uchun markazlashtirilgan authorization qaror qabul qilish tizimini belgilaydi. V2 versiyasi 10 ta kritik muammoni hal qiladi.

### 1.2 V2 Enhancements

**Muhim o'zgarishlar:**
1. UBAC modeli membership-based ga o'tkazildi
2. Decision chain 16 qadamga kengaytirildi (lifecycle checks)
3. Policy engine XACML-compliant bo'ldi (combining algorithm, versioning)
4. Audit log hash chain bilan immutable bo'ldi
5. Permission key nested va wildcard'ni qo'llab-quvvatlaydi
6. Role model hierarchy, templates, system roles qo'shildi
7. Platform vs tenant separation to'liq bo'ldi
8. Multi-tenancy isolation (RLS) qo'shildi
9. Performance va caching qo'shildi
10. Compliance standards (XACML, OAuth 2.0, OIDC, FIDO2) qo'shildi

### 1.3 Design Principles

1. **Multi-Model Access Control** — RBAC (asosiy) + ABAC (shartli) + UBAC (membership-based override)
2. **Identity ≠ Tenant ≠ Authorization** — uchta alohida qatlam
3. **Permission-Based** — barcha ruxsatlar permission orqali
4. **Tenant-Scoped Authorization** — tenant ichida role va permission
5. **Platform-Tenant Separation** — platform vs tenant permission'lar
6. **Membership-Based Override** — UBAC membership orqali
7. **XACML-Compliant Policy Engine** — combining algorithm, versioning
8. **Immutable Audit Trail** — hash chain, correlation ID
9. **Defense in Depth** — RLS, application-layer validation
10. **Performance-First** — multi-level caching, batch checks

---

## 2. Authorization Models

### 2.1 RBAC (Role-Based Access Control)

**Nima qiladi:**
- Role'ga permission'lar biriktiriladi
- Membership'ga role'lar biriktiriladi
- Permission'ni tekshirishda user → membership → role → permission

**Qachon ishlatiladi:**
- Asosiy model — ko'p holatlar
- Oddiy va tushunarli

**Tuzilishi:**
```
User
  ↓
Membership (user ↔ tenant)
  ↓
RoleAssignment (membership → role)
  ↓
RolePermission (role → permission)
  ↓
Permission
```

---

### 2.2 ABAC (Attribute-Based Access Control)

**Nima qiladi:**
- Attribute'lar asosida shartli ruxsatlar
- Time, location, resource attributes
- Murakkab shartlar (AND, OR, NOT)

**Qachon ishlatiladi:**
- Murakkab holatlar
- Dinamik ruxsatlar
- Shartli security policies

**XACML-Compliant:**
- Policy combining algorithm (deny-overrides, allow-overrides)
- Policy versioning
- Policy testing framework

---

### 2.3 UBAC (Membership-Based Access Control)

**Nima qiladi:**
- Membership'ga maxsus permission'lar
- Role'lar ustidan override
- Vaqtinchalik grant

**V2 O'zgarishi:**
- Global UserPermission o'rniga MembershipPermission
- Tenant konteksti aniq (membership orqali)
- PLATFORM uchun alohida permission (tenant_id = NULL)

**Tuzilishi:**
```
Membership (user ↔ tenant)
  ↓
MembershipPermission (membership → permission)
  ├── membershipId
  ├── permissionId
  ├── expiresAt
  └── grantedBy
```

---

### 2.4 ReBAC (Relationship-Based Access Control)

**Nima qiladi:**
- Relationship'lar asosida ruxsatlar
- Direct, indirect relationship'lar
- Graph-based authorization

**Kelajakda:**
- Agar kerak bo'lsa implement qilinadi
- Hozircha RBAC + ABAC + UBAC yetarli

---

## 3. Decision API

### 3.1 API Signature

```typescript
interface AuthorizationRequest {
  subject: {
    userId: string;
    tenantId?: string;
    membershipId?: string;
    roles: string[];
    authenticationLevel: number;  // 1=password, 2=MFA, 3=hardware
    attributes: Record<string, any>;
  };
  action: {
    type: string;
    scope: string;
  };
  resource: {
    type: string;
    id?: string;
    ownerId?: string;
    tenantId?: string;
    attributes: Record<string, any>;
  };
  environment: {
    timestamp: Date;
    location?: string;
    device?: {
      trustLevel: 'trusted' | 'unknown' | 'untrusted';
      deviceId: string;
    };
    ipAddress: string;
    userAgent: string;
  };
  session: {
    sessionId: string;
    expiresAt: Date;
    isRevoked: boolean;
  };
}

interface AuthorizationDecision {
  allow: boolean;
  reason: string;
  matchedPolicies: string[];
  matchedPermissions: string[];
  matchedMemberships: string[];
  requiresStepUp: boolean;
  stepUpRequirements?: string[];
}
```

### 3.2 Decision Chain (V2 - 16 Steps)

```
AuthorizationRequest
  ↓
Step 1: Authentication check
  ↓ subject.userId
  ↓
Step 2: Session validity check
  ↓ session.expiresAt > now, session.isRevoked = false
  ↓
Step 3: User lifecycle check
  ↓ user.status = 'ACTIVE'
  ↓
Step 4: Device trust check
  ↓ device.trustLevel = 'trusted' OR step-up MFA required
  ↓
Step 5: Tenant lifecycle check
  ↓ tenant.status = 'ACTIVE'
  ↓
Step 6: Membership lifecycle check
  ↓ membership.status = 'ACTIVE'
  ↓
Step 7: Role assignment check
  ↓ RoleAssignment.status = 'ACTIVE'
  ↓
Step 8: Role lifecycle check
  ↓ Role.status = 'ACTIVE'
  ↓
Step 9: Role-permission relationship check
  ↓ RolePermission exists
  ↓
Step 10: Permission lifecycle check
  ↓ Permission.status = 'ACTIVE'
  ↓
Step 11: Membership permission override check (UBAC)
  ↓ MembershipPermission exists, not expired
  ↓
Step 12: ABAC policy evaluation
  ↓ PolicyEngine.evaluate(request) with XACML combining
  ↓
Step 13: Resource ownership/scope check
  ↓ resource.ownerId === subject.userId OR resource.tenantId === subject.tenantId
  ↓
Step 14: Rate limit check
  ↓ user not rate-limited
  ↓
Step 15: Delegation check (agar kerak bo'lsa)
  ↓ subject.userId = delegated user OR subject.userId = delegator
  ↓
Step 16: Final decision
  ↓ ALLOW or DENY (default DENY)
```

---

## 4. Policy Engine (XACML-Compliant)

### 4.1 Policy Language (XACML-Inspired)

**JSON-Based Policy with Versioning:**
```json
{
  "id": "policy-001",
  "version": "1.0.0",
  "name": "Admin工作时间限制",
  "description": "Adminlar ish vaqtida 9:00-17:00 o'rtasida sensitive resource'larga kirishi mumkin",
  "effect": "allow",
  "subjects": [
    {
      "attribute": "role",
      "operator": "equals",
      "value": "admin"
    }
  ],
  "resources": [
    {
      "attribute": "type",
      "operator": "equals",
      "value": "sensitive"
    }
  ],
  "actions": [
    {
      "attribute": "type",
      "operator": "in",
      "value": ["read", "write", "delete"]
    }
  ],
  "conditions": [
    {
      "attribute": "time",
      "operator": "between",
      "value": ["09:00", "17:00"]
    }
  ],
  "priority": 100,
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z",
  "createdBy": "admin@example.com"
}
```

### 4.2 Policy Combining Algorithms

**1. Deny-Overrides (Default):**
- Agar bitta policy DENY qilsa — natija DENY
- Barcha policy'lar ALLOW bo'lsa — natija ALLOW

**2. Allow-Overrides:**
- Agar bitta policy ALLOW qilsa — natija ALLOW
- Barcha policy'lar DENY bo'lsa — natija DENY

**3. First-Applicable:**
- Birinchi matching policy'dan foydalaniladi

**4. Only-One-Applicable:**
- Faqat bitta policy matching bo'lishi kerak
- Aks holda — error

### 4.3 Policy Versioning

**Policy Version Table:**
```sql
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY,
  policy_id UUID NOT NULL,
  version TEXT NOT NULL,
  policy JSONB NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  createdBy UUID,
  CONSTRAINT uq_policy_versions UNIQUE(policy_id, version)
);
```

### 4.4 Policy Testing Framework

**Policy Test Sandbox:**
- Yangi policy'ni production'ga qo'yishdan oldin test
- Mock request'lar bilan test
- Expected vs actual decision comparison

---

## 5. Domain Model (V2)

### 5.1 Permission

**Entity:**
```typescript
class Permission {
  id: PermissionId;
  key: PermissionKey;  // e.g., "tenant.users.create", "platform.tenants.create"
  scope: PermissionScope;  // PLATFORM or TENANT
  displayName: string;
  description: string;
  metadata: Record<string, any>;
  status: PermissionStatus;  // ACTIVE or DELETED
  createdAt: Date;
  updatedAt: Date;
}
```

**Value Objects:**
- `PermissionId` (UUID)
- `PermissionKey` (string, supports nested: `tenant.users.profile.update`)
- `PermissionScope` (enum: PLATFORM, TENANT)
- `PermissionStatus` (enum: ACTIVE, DELETED)

**Rules:**
- Permission key supports nested resources and wildcards
- PLATFORM permissions are global
- TENANT permissions are tenant-scoped

---

### 5.2 TenantRole

**Entity:**
```typescript
class TenantRole {
  id: TenantRoleId;
  tenantId: TenantId;
  key: RoleKey;  // e.g., "admin", "editor", "viewer"
  displayName: string;
  description: string;
  type: RoleType;  // SYSTEM or CUSTOM
  parentId?: TenantRoleId;  // role hierarchy
  status: RoleStatus;  // ACTIVE or DELETED
  createdAt: Date;
  updatedAt: Date;
}
```

**Value Objects:**
- `TenantRoleId` (UUID)
- `TenantId` (UUID)
- `RoleKey` (string)
- `RoleType` (enum: SYSTEM, CUSTOM)
- `RoleStatus` (enum: ACTIVE, DELETED)

**Rules:**
- Role key is unique within tenant
- Role belongs to exactly one tenant
- System roles cannot be deleted
- Role hierarchy supported (parentId)

---

### 5.3 RolePermission

**Entity:**
```typescript
class RolePermission {
  roleId: TenantRoleId;
  permissionId: PermissionId;
  createdAt: Date;
}
```

**Rules:**
- Composite primary key (roleId, permissionId)
- Permission scope must match role scope
  - TENANT role → TENANT permission
  - PLATFORM role → PLATFORM permission

---

### 5.4 RoleAssignment

**Aggregate:**
```typescript
class RoleAssignment {
  id: RoleAssignmentId;
  membershipId: MembershipId;
  roleId: TenantRoleId;
  status: RoleAssignmentStatus;  // ACTIVE or DELETED
  grantedBy: UserId;
  grantedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Value Objects:**
- `RoleAssignmentId` (UUID)
- `MembershipId` (UUID)
- `TenantRoleId` (UUID)
- `RoleAssignmentStatus` (enum: ACTIVE, DELETED)

**Rules:**
- Role assignment belongs to membership (not user directly)
- Temporary grants supported (expiresAt)
- Role assignment status must be ACTIVE

---

### 5.5 MembershipPermission (V2 - UBAC)

**Entity:**
```typescript
class MembershipPermission {
  id: MembershipPermissionId;
  membershipId: MembershipId;
  permissionId: PermissionId;
  expiresAt?: Date;
  grantedBy: UserId;
  grantedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Value Objects:**
- `MembershipPermissionId` (UUID)
- `MembershipId` (UUID)
- `PermissionId` (UUID)

**Rules:**
- Membership permission overrides role-based permission
- Temporary grants supported (expiresAt)
- Expired permissions are ignored
- Tenant context via membership

---

## 6. Database Schema (V2)

### 6.1 permissions Table

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  key TEXT NOT NULL,
  scope TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT uq_permissions_key UNIQUE(key),
  CONSTRAINT chk_permissions_scope CHECK (scope IN ('TENANT', 'PLATFORM')),
  CONSTRAINT chk_permissions_status CHECK (status IN ('ACTIVE', 'DELETED'))
);

CREATE INDEX idx_permissions_scope ON permissions(scope);
CREATE INDEX idx_permissions_status ON permissions(status);
CREATE INDEX idx_permissions_key_pattern ON permissions USING gin (key gin_trgm_ops);  -- wildcard matching
```

### 6.2 tenant_roles Table

```sql
CREATE TABLE tenant_roles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,  -- SYSTEM or CUSTOM
  parent_id UUID,  -- role hierarchy
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT uq_tenant_roles_tenant_key UNIQUE(tenant_id, key),
  CONSTRAINT chk_tenant_roles_type CHECK (type IN ('SYSTEM', 'CUSTOM')),
  CONSTRAINT chk_tenant_roles_status CHECK (status IN ('ACTIVE', 'DELETED')),
  CONSTRAINT fk_tenant_roles_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_tenant_roles_parent_id FOREIGN KEY (parent_id) REFERENCES tenant_roles(id) ON DELETE SET NULL
);

CREATE INDEX idx_tenant_roles_tenant_id ON tenant_roles(tenant_id);
CREATE INDEX idx_tenant_roles_status ON tenant_roles(status);
CREATE INDEX idx_tenant_roles_parent_id ON tenant_roles(parent_id);
```

### 6.3 role_permissions Table

```sql
CREATE TABLE role_permissions (
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES tenant_roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);
```

### 6.4 role_assignments Table

```sql
CREATE TABLE role_assignments (
  id UUID PRIMARY KEY,
  membership_id UUID NOT NULL,
  role_id UUID NOT NULL,
  status TEXT NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT chk_role_assignments_status CHECK (status IN ('ACTIVE', 'DELETED')),
  CONSTRAINT fk_role_assignments_membership_id FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_assignments_role_id FOREIGN KEY (role_id) REFERENCES tenant_roles(id) ON DELETE CASCADE
);

CREATE INDEX idx_role_assignments_membership_id ON role_assignments(membership_id);
CREATE INDEX idx_role_assignments_role_id ON role_assignments(role_id);
CREATE UNIQUE INDEX uq_role_assignments_active_membership_role ON role_assignments(membership_id, role_id) WHERE status = 'ACTIVE';
```

### 6.5 membership_permissions Table (V2 - UBAC)

```sql
CREATE TABLE membership_permissions (
  id UUID PRIMARY KEY,
  membership_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT fk_membership_permissions_membership_id FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE,
  CONSTRAINT fk_membership_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_membership_permissions_membership_id ON membership_permissions(membership_id);
CREATE INDEX idx_membership_permissions_permission_id ON membership_permissions(permission_id);
CREATE INDEX idx_membership_permissions_expires_at ON membership_permissions(expires_at);
```

### 6.6 policies Table (ABAC with Versioning)

```sql
CREATE TABLE policies (
  id UUID PRIMARY KEY,
  tenant_id UUID,  -- NULL for platform policies
  name TEXT NOT NULL,
  description TEXT,
  effect TEXT NOT NULL,  -- allow or deny
  subjects JSONB NOT NULL,
  resources JSONB NOT NULL,
  actions JSONB NOT NULL,
  conditions JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  combining_algorithm TEXT NOT NULL DEFAULT 'deny-overrides',  -- deny-overrides, allow-overrides, first-applicable, only-one-applicable
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_policies_tenant_id ON policies(tenant_id);
CREATE INDEX idx_policies_priority ON policies(priority);
CREATE INDEX idx_policies_is_active ON policies(is_active);
```

### 6.7 policy_versions Table

```sql
CREATE TABLE policy_versions (
  id UUID PRIMARY KEY,
  policy_id UUID NOT NULL,
  version TEXT NOT NULL,
  policy JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID,
  CONSTRAINT uq_policy_versions UNIQUE(policy_id, version),
  CONSTRAINT fk_policy_versions_policy_id FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE
);

CREATE INDEX idx_policy_versions_policy_id ON policy_versions(policy_id);
```

---

## 7. Authorization Service Implementation (V2)

### 7.1 AuthorizationService

**Location:** `modules/access-control/src/application/services/AuthorizationService.ts`

**Responsibilities:**
1. Execute 16-step decision chain
2. Call PolicyEngine for ABAC (XACML combining)
3. Check MembershipPermission overrides (UBAC)
4. Return final decision
5. Audit log decision (immutable)
6. Cache decisions

**Dependencies:**
- `IMembershipRepository` (from modules/tenant)
- `IRoleAssignmentRepository`
- `IRolePermissionRepository`
- `IPermissionRepository`
- `IMembershipPermissionRepository` (V2)
- `PolicyEngine`
- `AuditLogger`
- `CacheService` (Redis)

**Implementation Sketch:**
```typescript
class AuthorizationService {
  async authorize(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    // Step 1-15: Execute decision chain
    const chainResult = await this.executeDecisionChain(request);
    
    // Step 16: Combine decisions
    const finalDecision = this.combineDecisions(chainResult);
    
    // Audit log (immutable)
    await this.auditLogger.log(request, finalDecision);
    
    // Cache decision
    await this.cacheService.set(this.buildCacheKey(request), finalDecision, { ttl: 300 });
    
    return finalDecision;
  }
  
  private async executeDecisionChain(request: AuthorizationRequest): Promise<ChainResult> {
    // Step 1: Authentication check
    if (!request.subject.userId) {
      return { allow: false, reason: 'Not authenticated' };
    }
    
    // Step 2: Session validity check
    if (request.session.isRevoked || request.session.expiresAt < new Date()) {
      return { allow: false, reason: 'Session invalid' };
    }
    
    // Step 3: User lifecycle check
    const user = await this.userRepository.findById(request.subject.userId);
    if (user.status !== 'ACTIVE') {
      return { allow: false, reason: 'User not active' };
    }
    
    // Step 4: Device trust check
    if (request.environment.device?.trustLevel === 'untrusted') {
      return { 
        allow: false, 
        reason: 'Device untrusted',
        requiresStepUp: true,
        stepUpRequirements: ['MFA']
      };
    }
    
    // Step 5: Tenant lifecycle check
    if (request.subject.tenantId) {
      const tenant = await this.tenantRepository.findById(request.subject.tenantId);
      if (tenant.status !== 'ACTIVE') {
        return { allow: false, reason: 'Tenant not active' };
      }
    }
    
    // Step 6: Membership lifecycle check
    const membership = await this.membershipRepository.findById(request.subject.membershipId);
    if (membership.status !== 'ACTIVE') {
      return { allow: false, reason: 'Membership not active' };
    }
    
    // Step 7-10: RBAC + Permission checks
    const rbacDecision = await this.checkRBAC(request);
    
    // Step 11: UBAC override check
    const ubacDecision = await this.checkUBAC(request);
    
    // Step 12: ABAC policy evaluation
    const abacDecision = await this.policyEngine.evaluate(request);
    
    // Step 13: Resource ownership check
    const ownershipDecision = this.checkOwnership(request);
    
    // Step 14: Rate limit check
    const rateLimitDecision = await this.checkRateLimit(request);
    
    // Step 15: Delegation check
    const delegationDecision = await this.checkDelegation(request);
    
    return {
      rbac: rbacDecision,
      ubac: ubacDecision,
      abac: abacDecision,
      ownership: ownershipDecision,
      rateLimit: rateLimitDecision,
      delegation: delegationDecision
    };
  }
  
  private async checkUBAC(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    // V2: Check membership permissions (not user permissions)
    const membershipPermission = await this.membershipPermissionRepository.findByMembershipAndPermission(
      request.subject.membershipId,
      request.action
    );
    
    if (membershipPermission && !this.isExpired(membershipPermission)) {
      return { allow: true, reason: 'UBAC override (membership-based)' };
    }
    
    return { allow: false, reason: 'No UBAC override' };
  }
}
```

---

## 8. Permission Key Format (V2)

### 8.1 Permission Key Convention

**Format:** `[namespace.]resource[.subresource[.subresource...]].action`

**Examples:**
- `tenant.users.create` — create user in tenant
- `tenant.users.read` — read user in tenant
- `tenant.users.update` — update user in tenant
- `tenant.users.delete` — delete user in tenant
- `tenant.users.profile.update` — update user profile in tenant
- `tenant.users.settings.notifications.update` — update notification settings
- `platform.tenants.create` — create tenant (platform admin)
- `platform.tenants.suspend` — suspend tenant (platform admin)
- `platform.subscriptions.manage` — manage subscriptions (platform admin)

### 8.2 Wildcard Support

**Wildcards:**
- `tenant.users.*` — barcha user action'lari
- `tenant.*` — barcha tenant action'lari
- `*` — barcha action'lari (PLATFORM admin uchun)

**Implementation:**
- PostgreSQL `pg_trgm` extension for pattern matching
- LIKE operator with wildcards
- Index on permission key with gin_trgm_ops

---

## 9. Role Model (V2)

### 9.1 System Roles vs Custom Roles

**System Roles:**
- Predefined roles for all tenants
- Cannot be deleted
- Can be customized (permission changes)
- Examples: `owner`, `admin`, `member`

**Custom Roles:**
- Tenant-created roles
- Can be deleted
- Full customization

### 9.2 Role Hierarchy

**Hierarchy Example:**
```
owner (parent)
  ↓
admin (parent: owner)
  ↓
editor (parent: admin)
  ↓
viewer (parent: editor)
```

**Inheritance:**
- `viewer` inherits all permissions from `editor`, `admin`, `owner`
- Permission union: role + all ancestors

### 9.3 Role Templates

**Template Definition:**
```typescript
interface RoleTemplate {
  key: string;
  displayName: string;
  description: string;
  permissions: PermissionKey[];
  type: 'SYSTEM' | 'CUSTOM';
}
```

**Default Templates:**
- `owner` — all tenant permissions
- `admin` — most tenant permissions
- `member` — basic tenant permissions

---

## 10. Platform vs Tenant Separation (V2)

### 10.1 Platform Admin

**Register/Login:**
- Alohida register (siz tomonidan)
- Alohida login flow
- Platform panel orqali kiradi

**Permissions:**
- PLATFORM scope permission'lar
- `platform.tenants.create`
- `platform.tenants.suspend`
- `platform.tenants.delete`
- `platform.subscriptions.manage`
- `platform.monitoring`

**Role:**
- Platform admin (SYSTEM role, tenant_id = NULL)

**Cross-Tenant Access:**
- Platform admin cross-tenant access uchun alohida audit
- Justification kerak
- Temporary access expiration

### 10.2 Tenant Admin

**Register/Login:**
- Kompaniya yaratish orqali
- Tenant yaratganda avtomatik Owner bo'ladi
- Tenant panel orqali kiradi

**Permissions:**
- TENANT scope permission'lar (o'z tenant ichida)
- O'z tenant ichida barcha permission'lar
- PLATFORM permission'ga ega emas

**Role:**
- Tenant owner (SYSTEM role, tenant_id = tenantId)

### 10.3 Tenant User

**Register/Login:**
- Invitation orqali qo'shiladi
- Tenant panel orqali kiradi

**Permissions:**
- TENANT scope permission'lar (o'z tenant ichida)
- Cheklangan permission'lar (admin tomonidan)
- PLATFORM permission'ga ega emas

---

## 11. Multi-Tenancy Isolation (V2)

### 11.1 Row-Level Security (RLS)

**PostgreSQL RLS Policy:**
```sql
-- Enable RLS on tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant isolation
CREATE POLICY tenant_isolation ON tenants
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY membership_isolation ON memberships
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY role_isolation ON tenant_roles
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### 11.2 Tenant Context Propagation

**Middleware:**
```typescript
class TenantContextMiddleware {
  async handle(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.tenantId;
    
    // Set PostgreSQL session variable
    await this.database.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    
    next();
  }
}
```

### 11.3 Repository Layer Validation

**Repository Pattern:**
```typescript
class MembershipRepository {
  async findByUser(userId: UserId, tenantId: TenantId): Promise<Membership[]> {
    // Always filter by tenantId
    return this.db.query.memberships.findMany({
      where: and(
        eq(memberships.userId, userId),
        eq(memberships.tenantId, tenantId)
      )
    });
  }
}
```

---

## 12. Audit Trail (V2)

### 12.1 Immutable Audit Log

**Table:**
```sql
CREATE TABLE authorization_audit_log (
  id UUID PRIMARY KEY,
  correlation_id UUID NOT NULL,
  request_id UUID NOT NULL,
  actor_user_id UUID,
  subject_user_id UUID,
  tenant_id UUID,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  decision TEXT,  -- allow or deny
  reason TEXT,
  matched_policies JSONB,
  matched_permissions JSONB,
  matched_memberships JSONB,
  before_state JSONB,
  after_state JSONB,
  ip_address TEXT,
  user_agent TEXT,
  device_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  hash TEXT,  -- hash chain with previous record
  CONSTRAINT uq_authorization_audit_log_correlation_id UNIQUE(correlation_id)
);

CREATE INDEX idx_authorization_audit_log_user_id ON authorization_audit_log(subject_user_id);
CREATE INDEX idx_authorization_audit_log_tenant_id ON authorization_audit_log(tenant_id);
CREATE INDEX idx_authorization_audit_log_timestamp ON authorization_audit_log(timestamp);
CREATE INDEX idx_authorization_audit_log_correlation_id ON authorization_audit_log(correlation_id);
```

### 12.2 Hash Chain

**Implementation:**
```typescript
class AuditLogger {
  async log(request: AuthorizationRequest, decision: AuthorizationDecision): Promise<void> {
    const previousRecord = await this.getPreviousRecord();
    const previousHash = previousRecord?.hash || 'INITIAL';
    
    const currentHash = this.computeHash({
      previousHash,
      request,
      decision,
      timestamp: new Date()
    });
    
    await this.db.insert(authorization_audit_log).values({
      correlationId: uuid(),
      requestId: request.requestId,
      actorUserId: request.actorUserId,
      subjectUserId: request.subject.userId,
      tenantId: request.subject.tenantId,
      action: request.action.type,
      resourceType: request.resource.type,
      resourceId: request.resource.id,
      decision: decision.allow ? 'allow' : 'deny',
      reason: decision.reason,
      matchedPolicies: decision.matchedPolicies,
      matchedPermissions: decision.matchedPermissions,
      matchedMemberships: decision.matchedMemberships,
      ipAddress: request.environment.ipAddress,
      userAgent: request.environment.userAgent,
      deviceId: request.environment.device?.deviceId,
      timestamp: new Date(),
      hash: currentHash
    });
  }
  
  private computeHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}
```

---

## 13. Performance and Caching (V2)

### 13.1 Multi-Level Caching

**Cache Layers:**
1. **L1: In-Memory (Per-Process)** — hot decisions
2. **L2: Redis (Distributed)** — shared cache
3. **L3: Database** — persistent storage

**Cache Keys:**
```
authz:decision:{userId}:{tenantId}:{action}:{resourceType}:{resourceId}
authz:permissions:{membershipId}
authz:roles:{membershipId}
authz:policies:{tenantId}
```

### 13.2 Cache Invalidation

**Invalidation Triggers:**
- Role assignment changed
- Permission changed
- Policy changed
- Membership status changed
- Tenant status changed

**Invalidation Strategy:**
- Cache busting (delete key)
- TTL-based expiration (5 minutes)
- Event-driven invalidation (pub/sub)

### 13.3 Batch Authorization

**API:**
```typescript
interface BatchAuthorizationRequest {
  userId: string;
  tenantId: string;
  requests: AuthorizationRequest[];
}

interface BatchAuthorizationResponse {
  decisions: AuthorizationDecision[];
}
```

**Implementation:**
- Single DB query for all permissions
- Batch role checks
- Batch policy evaluation

---

## 14. Compliance and Standards (V2)

### 14.1 Standards Compliance Matrix

| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| **XACML** | Policy language, combining algorithm | XACML-inspired JSON policy with combining algorithms |
| **OAuth 2.0** | Authorization framework | OAuth 2.0 for third-party apps |
| **OIDC** | Identity layer | OpenID Connect for authentication |
| **FIDO2/WebAuthn** | Passkey support | FIDO2 for passwordless auth |
| **SCIM** | User provisioning | SCIM for user sync (future) |
| **SAML** | Enterprise SSO | SAML for enterprise auth (future) |

### 14.2 GDPR Compliance

**Requirements:**
- User data export
- Right to be forgotten
- Audit trail
- Data retention policy

**Implementation:**
- Audit log retention: 7 years
- User data export API
- Account deletion with audit

### 14.3 SOC 2 Compliance

**Requirements:**
- Access control
- Audit trail
- Security monitoring
- Change management

**Implementation:**
- Immutable audit log
- Role-based access
- Security monitoring
- Change request tracking

---

## 15. Repository Ports (V2)

### 15.1 IPermissionRepository

```typescript
interface IPermissionRepository {
  findById(id: PermissionId): Promise<Permission | null>;
  findByKey(key: PermissionKey): Promise<Permission | null>;
  findByScope(scope: PermissionScope): Promise<Permission[]>;
  findByKeyPattern(pattern: string): Promise<Permission[]>;  // wildcard support
  save(permission: Permission): Promise<void>;
  delete(id: PermissionId): Promise<void>;
}
```

### 15.2 ITenantRoleRepository

```typescript
interface ITenantRoleRepository {
  findById(id: TenantRoleId): Promise<TenantRole | null>;
  findByTenantAndKey(tenantId: TenantId, key: RoleKey): Promise<TenantRole | null>;
  findByTenant(tenantId: TenantId): Promise<TenantRole[]>;
  findByHierarchy(parentId: TenantRoleId): Promise<TenantRole[]>;  // role hierarchy
  save(role: TenantRole): Promise<void>;
  delete(id: TenantRoleId): Promise<void>;
}
```

### 15.3 IRolePermissionRepository

```typescript
interface IRolePermissionRepository {
  findByRole(roleId: TenantRoleId): Promise<RolePermission[]>;
  save(rolePermission: RolePermission): Promise<void>;
  delete(roleId: TenantRoleId, permissionId: PermissionId): Promise<void>;
  deleteByRole(roleId: TenantRoleId): Promise<void>;
}
```

### 15.4 IRoleAssignmentRepository

```typescript
interface IRoleAssignmentRepository {
  findById(id: RoleAssignmentId): Promise<RoleAssignment | null>;
  findByMembership(membershipId: MembershipId): Promise<RoleAssignment[]>;
  save(roleAssignment: RoleAssignment): Promise<void>;
  delete(id: RoleAssignmentId): Promise<void>;
  deleteByMembership(membershipId: MembershipId): Promise<void>;
  deleteExpired(): Promise<void>;
}
```

### 15.5 IMembershipPermissionRepository (V2)

```typescript
interface IMembershipPermissionRepository {
  findById(id: MembershipPermissionId): Promise<MembershipPermission | null>;
  findByMembershipAndPermission(membershipId: MembershipId, permissionKey: PermissionKey): Promise<MembershipPermission | null>;
  findByMembership(membershipId: MembershipId): Promise<MembershipPermission[]>;
  save(membershipPermission: MembershipPermission): Promise<void>;
  delete(id: MembershipPermissionId): Promise<void>;
  deleteExpired(): Promise<void>;
}
```

---

## 16. Open Questions (V2)

### QUESTION-001: Policy Combining Algorithm Default

**Savol:** Default combining algorithm qaysi bo'lishi kerak?

**Options:**
A. Deny-overrides (xavfsizroq)
B. Allow-overrides (flexibler)

**Recommendation:** Deny-overrides (security-first)

---

### QUESTION-002: Role Hierarchy Depth

**Savol:** Role hierarchy maksimal chuqurligi qancha bo'lishi kerak?

**Options:**
A. 3 levels (owner → admin → member)
B. 5 levels
C. Unlimited

**Recommendation:** 3 levels (keep it simple)

---

### QUESTION-003: Permission Wildcard Scope

**Savol:** Wildcard qancha darajada qo'llab-quvvatlanadi?

**Options:**
A. Single level (`users.*`)
B. Multi-level (`*.users.*`)
C. Full glob pattern

**Recommendation:** Single level (simple and performant)

---

### QUESTION-004: Audit Log Retention

**Savol:** Audit log qancha vaqt saqlanadi?

**Options:**
A. 1 year
B. 3 years
C. 7 years (GDPR default)

**Recommendation:** 7 years (compliance)

---

## 17. Additional Blueprints Required

Based on the V2 analysis, these 7 additional blueprints are needed:

### 1. Device Management Blueprint
- Device lifecycle
- Trust levels (trusted, unknown, untrusted)
- Device registration
- Device revocation
- Device anomaly detection
- MDM integration

### 2. MFA Blueprint
- Multi-factor authentication
- TOTP (authenticator apps)
- SMS OTP
- Email OTP
- Backup codes
- FIDO2/WebAuthn

### 3. Session Management Blueprint
- Session lifecycle
- JWT refresh tokens
- Session revocation
- Session rotation
- Device-bound sessions
- Token hashing

### 4. Delegation Blueprint
- Permission delegation
- Temporary grants
- Approval workflows
- Impersonation
- Audit trail

### 5. API Key Management Blueprint
- API key lifecycle
- API key scopes
- API key rotation
- Rate limiting
- Service accounts

### 6. Conditional Access Blueprint
- Advanced ABAC policies
- Risk-based access
- Adaptive authentication
- Geo-fencing
- IP allowlist/blocklist
- Time-based access

### 7. Audit & Compliance Blueprint
- Comprehensive audit
- Compliance reporting
- Forensics
- Data retention
- Immutable storage
- Hash chain validation

---

## 18. Final Checklist (V2)

### Blueprint Completeness

- [x] Executive Summary
- [x] V2 Enhancements (10 critical issues resolved)
- [x] Authorization Models (RBAC, ABAC, UBAC membership-based, ReBAC)
- [x] Decision API (enhanced)
- [x] Decision Chain (16 steps with lifecycle checks)
- [x] Policy Engine (XACML-compliant, combining algorithm, versioning)
- [x] Domain Model (Permission, TenantRole with hierarchy, RolePermission, RoleAssignment, MembershipPermission)
- [x] Database Schema (7 tables, RLS policies)
- [x] AuthorizationService implementation sketch (V2)
- [x] Permission Key Format (nested, wildcard)
- [x] Role Model (system vs custom, hierarchy, templates)
- [x] Platform vs Tenant Separation (enhanced)
- [x] Multi-Tenancy Isolation (RLS, context propagation)
- [x] Audit Trail (immutable, hash chain, correlation)
- [x] Performance and Caching (multi-level, invalidation, batch)
- [x] Compliance and Standards (XACML, OAuth 2.0, OIDC, FIDO2, GDPR, SOC 2)
- [x] Repository Ports (5 interfaces, V2 with MembershipPermission)
- [x] Open Questions (4)
- [x] Additional Blueprints (7)

### Next Steps

1. **Tasdiqlash** — Siz bu V2 blueprintni tasdiqlaysizmi?
2. **Javob berish** — 4 ta open question'ga javob berasizmi?
3. **Keyingi blueprint** — Device Management Blueprint (1/7)

---

**END OF ACCESS CONTROL BLUEPRINT V2**
