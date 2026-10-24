# Access Control Blueprint

**IdentityPlatform — Multi-Model Authorization Architecture**

---

## 1. Executive Summary

### 1.1 Purpose

Bu blueprint **IdentityPlatform** uchun markazlashtirilgan authorization qaror qabul qilish tizimini belgilaydi.

### 1.2 Design Principles

1. **Multi-Model Access Control** — RBAC (asosiy) + ABAC (shartli) + UBAC (override)
2. **Identity ≠ Tenant ≠ Authorization** — uchta alohida qatlam
3. **Permission-Based** — barcha ruxsatlar permission orqali
4. **Tenant-Scoped Authorization** — tenant ichida role va permission
5. **Platform-Tenant Separation** — platform vs tenant permission'lar
6. **Explicit Override** — UBAC individual ruxsatlar uchun
7. **Policy Engine** — ABAC shartli ruxsatlar uchun
8. **Audit Trail** — barcha authorization qarorlari log qilinadi

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

**Misol:**
- User: "Ali"
- Membership: "Company A" tenant
- RoleAssignment: "admin" role
- RolePermission: "admin" role → "users.create" permission
- Check: Ali "users.create" permission'ga ega → ALLOW

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

**Attribute'lar:**
- **Subject attributes:** user.role, user.tenant, user.department
- **Resource attributes:** resource.type, resource.owner, resource.tenant
- **Action attributes:** action.type, action.scope
- **Environment attributes:** time, location, device.trust

**Misol:**
- Policy: "Adminlar ish vaqtida 9:00-17:00 o'rtasida sensitive resource'larga kirishi mumkin"
- Check: Subject.role = "admin", Time = 14:00 → ALLOW
- Check: Subject.role = "admin", Time = 20:00 → DENY

---

### 2.3 UBAC (User-Based Access Control)

**Nima qiladi:**
- Individual user'ga maxsus permission'lar
- Role'lar ustidan override
- Vaqtinchalik grant

**Qachon ishlatiladi:**
- Maxsus holatlar
- Temporary grants
- Exceptions

**Tuzilishi:**
```
UserPermission (user → permission)
  ├── userId
  ├── permissionId
  ├── expiresAt
  └── grantedBy
```

**Misol:**
- User: "Ali" (regular role: "user")
- UserPermission: "users.delete" (maxsus grant)
- Check: Ali "users.delete" permission'ga ega (override) → ALLOW

---

### 2.4 ReBAC (Relationship-Based Access Control)

**Nima qiladi:**
- Relationship'lar asosida ruxsatlar
- Direct, indirect relationship'lar
- Graph-based authorization

**Qachon ishlatiladi:**
- Murakkab relationship'lar
- Social graphs
- Document collaboration

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
    roles: string[];
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
    };
  };
}

interface AuthorizationDecision {
  allow: boolean;
  reason?: string;
  matchedPolicies?: string[];
  matchedPermissions?: string[];
}
```

### 3.2 Decision Chain

```
AuthorizationRequest
  ↓
Step 1: Authentication check
  ↓ subject.userId
  ↓
Step 2: Tenant context check
  ↓ subject.tenantId, resource.tenantId
  ↓
Step 3: Membership lifecycle check
  ↓ membership.status === 'ACTIVE'
  ↓
Step 4: Role assignment check
  ↓ RoleAssignment.status === 'ACTIVE'
  ↓
Step 5: Role lifecycle check
  ↓ Role.status === 'ACTIVE'
  ↓
Step 6: Role-permission relationship check
  ↓ RolePermission exists
  ↓
Step 7: Permission lifecycle check
  ↓ Permission.status === 'ACTIVE'
  ↓
Step 8: UBAC override check
  ↓ UserPermission exists, not expired
  ↓
Step 9: ABAC policy evaluation
  ↓ PolicyEngine.evaluate(request)
  ↓
Step 10: Resource ownership/scope check
  ↓ resource.ownerId === subject.userId OR resource.tenantId === subject.tenantId
  ↓
Step 11: Final decision
  ↓ ALLOW or DENY
```

### 3.3 Implementation Location

**Module:** `modules/access-control`

**Service:** `AuthorizationService`

**Signature:**
```typescript
class AuthorizationService {
  async authorize(request: AuthorizationRequest): Promise<AuthorizationDecision>;
}
```

---

## 4. Policy Engine (ABAC)

### 4.1 Policy Language

**JSON-Based Policy:**
```json
{
  "id": "policy-001",
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
  "isActive": true
}
```

### 4.2 Policy Evaluation

**Logic:**
```
For each active policy (ordered by priority):
  1. Match subjects
  2. Match resources
  3. Match actions
  4. Evaluate conditions
  5. If all match → return effect (allow/deny)
```

**Implementation Location:**
- Module: `modules/access-control`
- Service: `PolicyEngine`
- Schema: `policies` table

---

## 5. Domain Model

### 5.1 Permission

**Entity:**
```typescript
class Permission {
  id: PermissionId;
  key: PermissionKey;  // e.g., "users.create", "users.read"
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
- `PermissionKey` (string, format: "resource.action")
- `PermissionScope` (enum: PLATFORM, TENANT)
- `PermissionStatus` (enum: ACTIVE, DELETED)

**Rules:**
- Permission key is unique within scope
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
  status: RoleStatus;  // ACTIVE or DELETED
  createdAt: Date;
  updatedAt: Date;
}
```

**Value Objects:**
- `TenantRoleId` (UUID)
- `TenantId` (UUID)
- `RoleKey` (string)
- `RoleStatus` (enum: ACTIVE, DELETED)

**Rules:**
- Role key is unique within tenant
- Role belongs to exactly one tenant

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

### 5.5 UserPermission (UBAC)

**Entity:**
```typescript
class UserPermission {
  id: UserPermissionId;
  userId: UserId;
  permissionId: PermissionId;
  scope: PermissionScope;  // PLATFORM or TENANT
  expiresAt?: Date;
  grantedBy: UserId;
  grantedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Value Objects:**
- `UserPermissionId` (UUID)
- `UserId` (UUID)
- `PermissionId` (UUID)

**Rules:**
- User permission overrides role-based permission
- Temporary grants supported (expiresAt)
- Expired permissions are ignored

---

## 6. Database Schema

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
```

### 6.2 tenant_roles Table

```sql
CREATE TABLE tenant_roles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT uq_tenant_roles_tenant_key UNIQUE(tenant_id, key),
  CONSTRAINT chk_tenant_roles_status CHECK (status IN ('ACTIVE', 'DELETED')),
  CONSTRAINT fk_tenant_roles_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX idx_tenant_roles_tenant_id ON tenant_roles(tenant_id);
CREATE INDEX idx_tenant_roles_status ON tenant_roles(status);
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

### 6.5 user_permissions Table (UBAC)

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  scope TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT chk_user_permissions_scope CHECK (scope IN ('TENANT', 'PLATFORM')),
  CONSTRAINT fk_user_permissions_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_expires_at ON user_permissions(expires_at);
```

### 6.6 policies Table (ABAC)

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
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_policies_tenant_id ON policies(tenant_id);
CREATE INDEX idx_policies_priority ON policies(priority);
CREATE INDEX idx_policies_is_active ON policies(is_active);
```

---

## 7. Authorization Service Implementation

### 7.1 AuthorizationService

**Location:** `modules/access-control/src/application/services/AuthorizationService.ts`

**Responsibilities:**
1. Execute decision chain
2. Call PolicyEngine for ABAC
3. Check UBAC overrides
4. Return final decision
5. Audit log decision

**Dependencies:**
- `IMembershipRepository` (from modules/tenant)
- `IRoleAssignmentRepository`
- `IRolePermissionRepository`
- `IPermissionRepository`
- `IUserPermissionRepository`
- `PolicyEngine`

**Implementation Sketch:**
```typescript
class AuthorizationService {
  async authorize(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    // Step 1-8: RBAC + UBAC
    const rbacDecision = await this.checkRBAC(request);
    
    // Step 9: ABAC
    const abacDecision = await this.policyEngine.evaluate(request);
    
    // Step 10: Combine decisions
    const finalDecision = this.combineDecisions(rbacDecision, abacDecision);
    
    // Step 11: Audit log
    await this.auditLogger.log(request, finalDecision);
    
    return finalDecision;
  }
  
  private async checkRBAC(request: AuthorizationRequest): Promise<AuthorizationDecision> {
    // Check UBAC override first
    const ubacPermission = await this.userPermissionRepository.findByUserAndPermission(
      request.subject.userId,
      request.action
    );
    
    if (ubacPermission && !this.isExpired(ubacPermission)) {
      return { allow: true, reason: 'UBAC override' };
    }
    
    // Check role-based permissions
    const memberships = await this.membershipRepository.findByUser(request.subject.userId);
    const activeMemberships = memberships.filter(m => m.status === 'ACTIVE');
    
    for (const membership of activeMemberships) {
      const roleAssignments = await this.roleAssignmentRepository.findByMembership(membership.id);
      const activeAssignments = roleAssignments.filter(ra => ra.status === 'ACTIVE');
      
      for (const assignment of activeAssignments) {
        const rolePermissions = await this.rolePermissionRepository.findByRole(assignment.roleId);
        
        for (const rolePermission of rolePermissions) {
          const permission = await this.permissionRepository.findById(rolePermission.permissionId);
          
          if (this.permissionMatches(permission, request.action)) {
            return { allow: true, reason: 'RBAC grant' };
          }
        }
      }
    }
    
    return { allow: false, reason: 'No permission granted' };
  }
  
  private permissionMatches(permission: Permission, action: string): boolean {
    // Permission key format: "resource.action"
    // Action format: "resource.action"
    return permission.key === action;
  }
}
```

---

## 8. Permission Key Format

### 8.1 Permission Key Convention

**Format:** `resource.action`

**Examples:**
- `users.create` — create user
- `users.read` — read user
- `users.update` — update user
- `users.delete` — delete user
- `tenants.create` — create tenant
- `tenants.read` — read tenant
- `memberships.invite` — invite member
- `roles.assign` — assign role
- `permissions.grant` — grant permission

### 8.2 Permission Scope

**PLATFORM Permissions:**
- `tenants.create` — create tenant (platform admin only)
- `tenants.suspend` — suspend tenant (platform admin only)
- `tenants.delete` — delete tenant (platform admin only)
- `subscriptions.manage` — manage subscriptions (platform admin only)
- `platform.monitoring` — view platform metrics (platform admin only)

**TENANT Permissions:**
- `users.create` — create user (tenant admin)
- `users.read` — read user (tenant member)
- `users.update` — update user (self or admin)
- `users.delete` — delete user (admin only)
- `memberships.invite` — invite member (admin)
- `roles.assign` — assign role (admin)
- `settings.update` — update settings (admin)

---

## 9. Platform vs Tenant Separation

### 9.1 Platform Admin

**Register/Login:**
- Alohida register (siz tomonidan)
- Alohida login flow
- Platform panel orqali kiradi

**Permissions:**
- PLATFORM scope permission'lar
- `tenants.create`
- `tenants.suspend`
- `tenants.delete`
- `subscriptions.manage`
- `platform.monitoring`

**Role:**
- Platform admin (maxsus role)

---

### 9.2 Tenant Admin

**Register/Login:**
- Kompaniya yaratish orqali
- Tenant yaratganda avtomatik Owner bo'ladi
- Tenant panel orqali kiradi

**Permissions:**
- TENANT scope permission'lar (o'z tenant ichida)
- `users.create` (o'z tenant uchun)
- `users.read` (o'z tenant uchun)
- `users.update` (o'z tenant uchun)
- `users.delete` (o'z tenant uchun)
- `memberships.invite`
- `roles.assign`
- `settings.update`

**Role:**
- Tenant admin (o'z tenant ichida maxsus role)

---

### 9.3 Tenant User

**Register/Login:**
- Invitation orqali qo'shiladi
- Tenant panel orqali kiradi

**Permissions:**
- TENANT scope permission'lar (o'z tenant ichida)
- Cheklangan permission'lar (admin tomonidan)
- `users.read` (o'z tenant uchun)
- `users.update` (o'zi uchun)

**Role:**
- Tenant member (default role)

---

## 10. Audit Trail

### 10.1 Authorization Audit Log

**What to Log:**
- Request timestamp
- Subject (userId, tenantId, roles)
- Action (type, scope)
- Resource (type, id, ownerId, tenantId)
- Decision (allow/deny)
- Reason
- Matched policies
- Matched permissions

**Table:**
```sql
CREATE TABLE authorization_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  tenant_id UUID,
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  decision TEXT,  -- allow or deny
  reason TEXT,
  matched_policies JSONB,
  matched_permissions JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_authorization_audit_log_user_id ON authorization_audit_log(user_id);
CREATE INDEX idx_authorization_audit_log_tenant_id ON authorization_audit_log(tenant_id);
CREATE INDEX idx_authorization_audit_log_timestamp ON authorization_audit_log(timestamp);
```

---

## 11. Implementation Guidelines

### 11.1 Permission Management

**Creating Permission:**
- Key must follow `resource.action` format
- Scope must be PLATFORM or TENANT
- PLATFORM permissions only for platform admin
- TENANT permissions only for tenant-specific resources

**Example:**
```typescript
// PLATFORM permission
const permission = Permission.create({
  key: 'tenants.create',
  scope: PermissionScope.PLATFORM,
  displayName: 'Create Tenant',
  description: 'Create a new tenant'
});

// TENANT permission
const permission = Permission.create({
  key: 'users.create',
  scope: PermissionScope.TENANT,
  displayName: 'Create User',
  description: 'Create a new user in tenant'
});
```

### 11.2 Role Management

**Creating Role:**
- Role key must be unique within tenant
- Role belongs to exactly one tenant
- Assign permissions to role using RolePermission

**Example:**
```typescript
const role = TenantRole.create({
  tenantId: tenantId,
  key: 'admin',
  displayName: 'Admin',
  description: 'Tenant administrator',
  status: RoleStatus.ACTIVE
});

// Assign permissions
const rolePermission = RolePermission.create({
  roleId: role.id,
  permissionId: permissionId
});
```

### 11.3 Role Assignment

**Assigning Role:**
- Role assignment belongs to membership (not user directly)
- Temporary grants supported (expiresAt)
- Must check membership status before assignment

**Example:**
```typescript
const roleAssignment = RoleAssignment.create({
  membershipId: membershipId,
  roleId: roleId,
  status: RoleAssignmentStatus.ACTIVE,
  grantedBy: currentUserId,
  expiresAt: expiresAt  // optional
});
```

### 11.4 UBAC Override

**Granting User Permission:**
- User permission overrides role-based permission
- Temporary grants supported (expiresAt)
- Must check permission scope (PLATFORM or TENANT)

**Example:**
```typescript
const userPermission = UserPermission.create({
  userId: userId,
  permissionId: permissionId,
  scope: PermissionScope.TENANT,
  expiresAt: expiresAt,  // optional
  grantedBy: currentUserId
});
```

---

## 12. Repository Ports

### 12.1 IPermissionRepository

```typescript
interface IPermissionRepository {
  findById(id: PermissionId): Promise<Permission | null>;
  findByKey(key: PermissionKey): Promise<Permission | null>;
  findByScope(scope: PermissionScope): Promise<Permission[]>;
  save(permission: Permission): Promise<void>;
  delete(id: PermissionId): Promise<void>;
}
```

### 12.2 ITenantRoleRepository

```typescript
interface ITenantRoleRepository {
  findById(id: TenantRoleId): Promise<TenantRole | null>;
  findByTenantAndKey(tenantId: TenantId, key: RoleKey): Promise<TenantRole | null>;
  findByTenant(tenantId: TenantId): Promise<TenantRole[]>;
  save(role: TenantRole): Promise<void>;
  delete(id: TenantRoleId): Promise<void>;
}
```

### 12.3 IRolePermissionRepository

```typescript
interface IRolePermissionRepository {
  findByRole(roleId: TenantRoleId): Promise<RolePermission[]>;
  save(rolePermission: RolePermission): Promise<void>;
  delete(roleId: TenantRoleId, permissionId: PermissionId): Promise<void>;
  deleteByRole(roleId: TenantRoleId): Promise<void>;
}
```

### 12.4 IRoleAssignmentRepository

```typescript
interface IRoleAssignmentRepository {
  findById(id: RoleAssignmentId): Promise<RoleAssignment | null>;
  findByMembership(membershipId: MembershipId): Promise<RoleAssignment[]>;
  save(roleAssignment: RoleAssignment): Promise<void>;
  delete(id: RoleAssignmentId): Promise<void>;
  deleteByMembership(membershipId: MembershipId): Promise<void>;
}
```

### 12.5 IUserPermissionRepository

```typescript
interface IUserPermissionRepository {
  findById(id: UserPermissionId): Promise<UserPermission | null>;
  findByUserAndPermission(userId: UserId, permissionKey: PermissionKey): Promise<UserPermission | null>;
  findByUser(userId: UserId): Promise<UserPermission[]>;
  save(userPermission: UserPermission): Promise<void>;
  delete(id: UserPermissionId): Promise<void>;
  deleteExpired(): Promise<void>;
}
```

---

## 13. Middleware Integration

### 13.1 Authorization Middleware

**Location:** `modules/access-control/src/presentation/http/middleware/AuthorizationMiddleware.ts`

**Responsibilities:**
1. Extract subject from JWT token
2. Extract action from request
3. Extract resource from request
4. Build AuthorizationRequest
5. Call AuthorizationService.authorize()
6. If DENY → return 403 Forbidden
7. If ALLOW → proceed

**Implementation Sketch:**
```typescript
class AuthorizationMiddleware {
  constructor(
    private authorizationService: AuthorizationService,
    private jwtService: JwtService
  ) {}
  
  async handle(req: Request, res: Response, next: NextFunction) {
    // Extract subject from JWT
    const token = req.headers.authorization?.replace('Bearer ', '');
    const payload = this.jwtService.verify(token);
    
    // Extract action from request
    const action = this.extractAction(req);
    
    // Extract resource from request
    const resource = this.extractResource(req);
    
    // Build request
    const request: AuthorizationRequest = {
      subject: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        roles: payload.roles,
        attributes: {}
      },
      action: {
        type: action.type,
        scope: action.scope
      },
      resource: resource,
      environment: {
        timestamp: new Date(),
        device: {
          trustLevel: req.device?.trustLevel || 'unknown'
        }
      }
    };
    
    // Authorize
    const decision = await this.authorizationService.authorize(request);
    
    if (!decision.allow) {
      return res.status(403).json({
        error: 'Forbidden',
        reason: decision.reason
      });
    }
    
    next();
  }
  
  private extractAction(req: Request): { type: string; scope: string } {
    // Extract from route
    const route = req.route;
    return {
      type: route.meta?.action || 'unknown',
      scope: route.meta?.scope || 'unknown'
    };
  }
  
  private extractResource(req: Request): Resource {
    // Extract from route params
    const params = req.params;
    return {
      type: req.route.meta?.resource || 'unknown',
      id: params.id,
      ownerId: params.ownerId,
      tenantId: req.tenantId,
      attributes: {}
    };
  }
}
```

---

## 14. Dependency Graph

```
modules/access-control
  ↓
modules/tenant (Membership)
  ↓
modules/identity (User)
  ↓
packages/platform-database (PostgreSQL)
```

---

## 15. Open Questions

### QUESTION-001: ABAC Policy Language

**Savol:** ABAC uchun qaysi policy language ishlatamiz?

**Options:**
A. JSON-based (simple, readable)
B. Rego (OPA, powerful, complex)
C. Custom DSL (flexible)

**Requires:** Technical decision

---

### QUESTION-002: Policy Evaluation Order

**Savol:** ABAC policy'larni qanday tartibda baholaymiz?

**Options:**
A. Priority ascending (highest priority first)
B. Priority descending (lowest priority first)
C. Match count (most matches first)

**Requires:** Technical decision

---

### QUESTION-003: UBAC Expiration

**Savol:** UBAC expiration qachon tekshiriladi?

**Options:**
A. Authorization time (expiresAt < now)
B. Cron job (periodic cleanup)
C. Lazy (on demand)

**Requires:** Technical decision

---

### QUESTION-004: Permission Scope Validation

**Savol: Role-permission mapping'da scope validation qanday bo'ladi?

**Options:**
A. Strict validation (TENANT role → TENANT permission only)
B. Loose validation (any role → any permission)
C. Warning only

**Requires:** Technical decision

---

## 16. Final Checklist

### Blueprint Completeness

- [x] Executive Summary
- [x] Authorization Models (RBAC, ABAC, UBAC, ReBAC)
- [x] Decision API
- [x] Decision Chain
- [x] Policy Engine (ABAC)
- [x] Domain Model (Permission, TenantRole, RolePermission, RoleAssignment, UserPermission)
- [x] Database Schema (6 tables)
- [x] AuthorizationService implementation sketch
- [x] Permission Key Format
- [x] Platform vs Tenant Separation
- [x] Audit Trail
- [x] Implementation Guidelines
- [x] Repository Ports (5 interfaces)
- [x] Middleware Integration
- [x] Dependency Graph
- [x] Open Questions (4)

### Next Steps

1. **Tasdiqlash** — Siz bu blueprintni tasdiqlaysizmi?
2. **Javob berish** — 4 ta open question'ga javob berasizmi?
3. **Keyingi blueprint** — Device Management Blueprint

---

**END OF ACCESS CONTROL BLUEPRINT**
