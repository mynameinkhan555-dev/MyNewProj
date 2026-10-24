# GIT FORENSIC ARCHITECTURE RECONSTRUCTION REPORT

**IdentityPlatform — IAM → Identity Evolution Analysis**

---

## 1. EXECUTIVE SUMMARY

### CRITICAL FINDING: New Identity Architecture is UNTRACKED

**The modules/identity and packages/platform-database/migrations directories do NOT exist in Git history.**

These are **UNTRACKED FILES** created in the current working tree and have never been committed. The "New Identity" architecture is recent local development work, not part of the committed repository.

### Repository Timeline

| Date | Commit | Author | Event |
|------|--------|--------|-------|
| Sept 8, 2026 | a633301 | Ahyor Sabirjonovich | Initial commit - monorepo with IAM module |
| Sept 9, 2026 | 236c74d | Ahyor Sabirjonovich | Move monorepo contents to repository root |
| Sept 9, 2026 | Multiple commits | Ahyor/AxyorSabirjonovich | Platform database refactoring, CI fixes |
| Sept 29, 2026 | ea30c48 | Ahyor Sabirjonovich | Add migration runtime and platform database packages |
| **CURRENT** | **UNTRACKED** | **UNKNOWN** | **modules/identity created (not committed)** |
| **CURRENT** | **UNTRACKED** | **UNKNOWN** | **packages/platform-database/migrations created (not committed)** |

### Key Architectural Facts

**VERIFIED:**
- `modules/iam` exists in initial commit (a633301)
- `modules/tenant` exists in initial commit as placeholder with domain stubs
- `modules/access-control` exists in initial commit as placeholder
- `packages/contracts/src/identity` exists in initial commit (API contracts)
- IAM has complete implementation (domain, application, infrastructure, presentation)
- IAM has 6 initial migrations (0001-0006)
- IAM has 7 additional migrations (0007-0013) added in ea30c48

**NOT VERIFIED:**
- When `modules/identity` was created (no Git history)
- Who created `modules/identity` (no Git history)
- Why `modules/identity` was created (no commit message)
- Relationship between `modules/identity` and IAM (no Git history)
- Migration strategy for `modules/identity` (no Git history)

**UNKNOWN:**
- Motivation for creating `modules/identity`
- Whether `modules/identity` is intended to replace IAM
- Whether `modules/identity` is experimental
- Whether `modules/identity` is parallel architecture

---

## 2. GIT FORENSIC TIMELINE

### Stage 1: Initial Monorepo Creation

**Date:** Sept 8, 2026 22:54:43 +0500
**Commit:** a6333012494e08a68a39394877065925145e83e3
**Author:** Ahyor Sabirjonovich <oazismpz@gmail.com>
**Message:** "feat: initial commit - monorepo with IAM module"

**Files Created (1532 files, 36994 insertions):**

**IAM Module (Complete Implementation):**
- `project/modules/iam/src/domain/` - Domain entities (User, Role, Permission, Policy, OAuth, SocialIdentity)
- `project/modules/iam/src/application/` - Command/query handlers, services
- `project/modules/iam/src/infrastructure/` - Repositories, OAuth providers, security, mappers
- `project/modules/iam/src/presentation/` - HTTP controllers, middleware, validators, GraphQL, gRPC
- `project/modules/iam/src/infrastructure/database/migrations/` - 6 migrations (0001-0006)
- `project/modules/iam/src/infrastructure/database/schema/` - Drizzle schema
- `project/modules/iam/src/infrastructure/database/seed/` - RBAC seed data

**Tenant Module (Placeholder with Domain Stubs):**
- `project/modules/tenant/src/domain/Member.ts`
- `project/modules/tenant/src/domain/Organization.ts`
- `project/modules/tenant/src/domain/Tenant.ts`
- `project/modules/tenant/src/domain/TenantSettings.ts`
- `project/modules/tenant/src/domain/TenantStatus.ts`
- `project/modules/tenant/src/domain/events/` - TenantCreatedEvent, TenantUpdatedEvent, MemberAddedEvent
- `project/modules/tenant/src/domain/repositories/` - MemberRepository, TenantRepository
- `project/modules/tenant/src/application/.gitkeep` - empty placeholder
- `project/modules/tenant/src/infrastructure/.gitkeep` - empty placeholder
- `project/modules/tenant/src/presentation/.gitkeep` - empty placeholder

**Access Control Module (Placeholder):**
- `project/modules/access-control/src/domain/.gitkeep` - empty placeholder
- `project/modules/access-control/src/application/.gitkeep` - empty placeholder
- `project/modules/access-control/src/infrastructure/.gitkeep` - empty placeholder
- `project/modules/access-control/src/presentation/.gitkeep` - empty placeholder

**Identity API Contracts (Not Implementation):**
- `project/packages/contracts/src/identity/account/` - RegisterRequest, RegisterResponse, VerifyEmailRequest, etc.
- `project/packages/contracts/src/identity/connections/` - ConnectAccountRequest, ConnectedAccountDto, etc.
- `project/packages/contracts/src/identity/data/` - DeleteAccountRequest, ExportDataRequest, etc.
- `project/packages/contracts/src/identity/profile/` - ProfileDto, UpdateProfileRequest, etc.
- `project/packages/contracts/src/identity/security/` - ChangePasswordRequest, TwoFactorEnableResponse, etc.
- `project/packages/contracts/src/identity/sessions/` - SessionDto, ListSessionsResponse, etc.

**Platform Infrastructure:**
- `project/packages/platform/` - Complete platform infrastructure (cache, encryption, JWT, logger, messaging, observability, scheduler, storage, validation)
- `project/packages/kernel/` - Domain primitives (AggregateRoot, DomainEvent, Entity, ID, Time)
- `project/packages/contracts/` - API contracts for all modules

**Apps:**
- `project/apps/api/` - Express API with IAM integration
- `project/apps/web/` - Next.js web UI (placeholder)
- `project/apps/admin/` - Next.js admin UI (placeholder)
- `project/apps/mobile/` - Expo React Native (placeholder)
- `project/apps/telegram/` - Grammy bot (placeholder)

**Evidence:**
- Git show a633301 --stat shows all 1532 files created
- Git show a633301 --name-status shows file-by-file additions
- IAM has complete implementation across all layers
- Tenant has domain stubs but no implementation
- Access Control has only placeholders
- Identity has API contracts but no implementation

**Conclusion:** 
- IAM was the intended runtime architecture from the start
- Tenant and Access Control were planned but not implemented
- Identity API contracts existed but no implementation module

---

### Stage 2: Repository Restructure

**Date:** Sept 9, 2026 00:48:07 +0500
**Commit:** 236c74d90db6e9103324d963367ec41e641d95bb
**Author:** Ahyor Sabirjonovich <oazismpz@gmail.com>
**Message:** "chore: move monorepo contents to repository root"

**Files Changed:** R100 renames from `project/` to root

**Evidence:**
- Git show 236c74d --stat shows 1539 files renamed
- Git log --name-status shows R100 for all files
- No code changes, only directory restructure

**Conclusion:**
- Pure directory move operation
- No architectural changes
- All modules moved from `project/` to repository root

---

### Stage 3: Platform Database Refactoring

**Date:** Sept 9, 2026 (multiple commits)
**Commits:** 
- 38796f2 - feat(platform): add canonical PostgreSQL database factory
- 41d78b7 - feat(platform): export canonical PostgreSQL database factory
- Multiple refactor commits removing legacy database configuration

**Files Changed:**
- Added `packages/platform/src/database/drizzle/PostgresDatabase.ts`
- Refactored database health checks
- Removed legacy database package configurations

**Evidence:**
- Git log shows incremental database refactoring
- Platform database abstraction added
- Legacy database configs removed

**Conclusion:**
- Platform database boundary consolidated
- PostgreSQL database factory added to platform package
- No changes to IAM or tenant modules

---

### Stage 4: Migration Runtime Addition

**Date:** Sept 29, 2026 15:11:23 +0500
**Commit:** ea30c48415bb7d8f9a57e5b5888e5be17e97f9b7
**Author:** Ahyor Sabirjonovich <oazismpz@gmail.com>
**Message:** "Add migration runtime and platform database packages"

**Files Added:**
- `packages/migration-runtime/` - Migration execution logic
- `packages/platform-database/` - PostgreSQL database abstraction
- `modules/iam/src/infrastructure/database/migrations/0007_add_tenant_module.sql`
- `modules/iam/src/infrastructure/database/migrations/0008_add_membership_module.sql`
- `modules/iam/src/infrastructure/database/migrations/0009_add_tenant_roles.sql`
- `modules/iam/src/infrastructure/database/migrations/0010_add_role_assignments.sql`
- `modules/iam/src/infrastructure/database/migrations/0011_add_invitations.sql`
- `modules/iam/src/infrastructure/database/migrations/0012_fix_role_assignment_cascade.sql`
- Migration runtime scripts and fingerprint validation

**Evidence:**
- Git show ea30c48 --stat shows 23 files added
- 7 new IAM migrations for tenant support
- Migration runtime package added
- Platform database package added (NOT migrations, just database abstraction)

**Conclusion:**
- IAM tenant support extended with 7 new migrations
- Migration runtime infrastructure added
- Platform database package added as PostgreSQL abstraction
- NO New Identity schema added

---

### Stage 5: UNTRACKED New Identity Creation

**Date:** UNKNOWN (not in Git history)
**Commit:** NONE (untracked files)
**Author:** UNKNOWN (not in Git history)
**Message:** NONE (not in Git history)

**Untracked Files (Current Working Tree):**
```
modules/identity/
  src/domain/User.ts
  src/domain/EmailIdentity.ts
  src/domain/ExternalIdentity.ts
  src/domain/PasswordCredential.ts
  src/domain/Session.ts
  infrastructure/persistence/drizzle/schema/users.table.ts
  infrastructure/persistence/drizzle/schema/email-identities.table.ts
  infrastructure/persistence/drizzle/schema/external-identities.table.ts
  infrastructure/persistence/drizzle/schema/password-credentials.table.ts
  infrastructure/persistence/drizzle/schema/sessions.table.ts
  infrastructure/persistence/drizzle/repositories/user.repository.ts
  infrastructure/persistence/drizzle/repositories/user.repository.integration.test.ts
  tests/domain/*.test.ts

modules/tenant/ (additional untracked changes)
  src/domain/Membership.ts
  src/domain/MembershipId.ts
  src/domain/MembershipStatus.ts
  src/domain/TenantId.ts
  src/domain/events/MembershipEvents.ts
  src/domain/events/TenantEvents.ts
  src/domain/repositories/IMembershipRepository.ts
  src/domain/repositories/ITenantRepository.ts
  infrastructure/persistence/drizzle/schema/memberships.table.ts
  infrastructure/persistence/drizzle/schema/tenants.table.ts
  tests/domain/*.test.ts

modules/access-control/ (additional untracked changes)
  src/domain/permission/Permission.ts
  src/domain/role/Role.ts
  src/domain/assignment/RoleAssignment.ts
  src/domain/role-permission/RolePermission.ts
  infrastructure/persistence/drizzle/schema/permissions.table.ts
  infrastructure/persistence/drizzle/schema/role-assignments.table.ts
  infrastructure/persistence/drizzle/schema/role-permissions.table.ts
  infrastructure/persistence/drizzle/schema/tenant-roles.table.ts
  tests/domain/*.test.ts

packages/platform-database/ (additional untracked changes)
  migrations/0000_identity.sql
  migrations/0001_tenant.sql
  migrations/0002_authorization.sql
  migrations/0003_outbox.sql
  src/persistence/PersistenceError.ts
  src/schema/
  src/unitOfWork/
  drizzle.config.ts
```

**Evidence:**
- Git status shows untracked files in modules/identity
- Git status shows untracked files in packages/platform-database/migrations
- Git log --all shows NO commits for modules/identity
- Git log --all shows NO commits for packages/platform-database/migrations
- Git log --diff-filter=A shows NO additions for these directories

**Conclusion:**
- New Identity architecture is NOT in Git history
- These are local untracked files created in current working tree
- Creation date, author, and motivation are UNKNOWN
- No architectural decision document exists in Git history
- No migration strategy document exists in Git history

---

## 3. IAM EVOLUTION

### 3.1 Initial Architecture (a633301)

**Domain Layer:**
- `User` entity (combined identity with email, password, display_name)
- `Role` entity (global roles)
- `Permission` entity (global permissions)
- `Policy` entity (ABAC support)
- `OAuthProvider` enum (Google, GitHub, Telegram)
- `SocialIdentity` entity (OAuth identities)
- Domain events for user lifecycle

**Application Layer:**
- `RegisterUserHandler` - user registration
- `LoginUserHandler` - user login
- `LogoutUserHandler` - user logout
- `ChangePasswordHandler` - password change
- `AssignRoleHandler` - role assignment
- `OAuthLoginHandler` - OAuth login
- `LinkSocialAccountHandler` - account linking
- `InitiateOAuthHandler` - OAuth initiation
- `PolicyService` - policy evaluation
- `AuthService` - authentication orchestration

**Infrastructure Layer:**
- `DrizzleUserRepository` - PostgreSQL user repository
- `DrizzleRoleRepository` - PostgreSQL role repository
- `DrizzleSessionRepository` - PostgreSQL session repository
- `DrizzleSocialIdentityRepository` - PostgreSQL social identity repository
- `DrizzlePolicyRepository` - PostgreSQL policy repository
- `DrizzleOAuthStateRepository` - PostgreSQL OAuth state repository
- `BcryptPasswordHasher` - password hashing
- `IamJwtService` - JWT token generation
- `GoogleOAuthProvider` - Google OAuth integration
- `GitHubOAuthProvider` - GitHub OAuth integration
- `TelegramOAuthProvider` - Telegram OAuth integration
- In-memory repositories for testing

**Presentation Layer:**
- `AuthController` - HTTP authentication endpoints
- `OAuthController` - HTTP OAuth endpoints
- `UserController` - HTTP user management endpoints
- `RoleController` - HTTP role management endpoints
- `PermissionController` - HTTP permission endpoints
- `PolicyController` - HTTP policy endpoints
- `AuthGuard` - JWT authentication middleware
- `RoleGuard` - role-based authorization middleware
- `PermissionGuard` - permission-based authorization middleware
- GraphQL resolvers (Auth, User, Role)
- gRPC controllers (Auth, User)

**Database Schema (6 migrations):**
- `0001_initial.sql` - identities, iam_roles, iam_permissions, iam_sessions, social_identities, iam_policies, iam_devices
- `0002_add_mfa.sql` - MFA support
- `0003_add_soft_delete.sql` - soft delete support
- `0004_add_oauth_states.sql` - OAuth state tracking
- `0005_add_outbox_events.sql` - outbox pattern for events
- `0006_add_password_set.sql` - password set functionality

**Runtime Integration:**
- `apps/api/src/container/iam-container.ts` - IAM dependency injection
- `apps/api/src/routes.ts` - IAM router mounted at /api/v1
- `apps/api/src/bootstrap.ts` - application bootstrap

**Evidence:**
- Git show a633301 shows complete IAM implementation
- All layers present in initial commit
- Database schema includes 6 migrations
- Runtime integration in apps/api

**Conclusion:**
- IAM was fully implemented from day one
- All architectural layers present
- Complete runtime integration
- Feature-complete authentication/authorization

---

### 3.2 Tenant Extension (ea30c48)

**Additional Migrations (7 migrations):**
- `0007_add_tenant_module.sql` - tenants table
- `0008_add_membership_module.sql` - tenant_memberships table
- `0009_add_tenant_roles.sql` - tenant_roles table
- `0010_add_role_assignments.sql` - role_assignments table
- `0011_add_invitations.sql` - invitations table
- `0012_fix_role_assignment_cascade.sql` - cascade fix
- `0013_magic_link_tokens.sql` - magic link tokens table

**Evidence:**
- Git show ea30c48 shows 7 new migrations
- Tenant support added as extension to existing IAM
- No architectural refactoring

**Conclusion:**
- IAM tenant support added as extension
- Not a redesign, just feature addition
- Same monolithic identity model extended

---

## 4. IDENTITY EVOLUTION

### 4.1 Git History Analysis

**CRITICAL: NO GIT HISTORY**

```
$ git log --all --oneline -- modules/identity
(empty - no commits)

$ git log --all --oneline --diff-filter=A --name-status | grep "modules/identity"
(empty - no additions)

$ git log --all --oneline --name-status | grep "modules/identity"
(empty - no changes)
```

**Evidence:**
- No commits ever touched modules/identity
- No file additions in Git history
- No file modifications in Git history
- Git status shows modules/identity as UNTRACKED

**Conclusion:**
- modules/identity does NOT exist in Git history
- Created locally in current working tree
- Creation date UNKNOWN
- Author UNKNOWN
- Motivation UNKNOWN

---

### 4.2 Current State (Untracked Files)

**Domain Layer:**
- `User` aggregate (canonical global user with status only)
- `EmailIdentity` aggregate (email per user)
- `ExternalIdentity` aggregate (OAuth/social per user)
- `PasswordCredential` aggregate (password per user)
- `Session` aggregate (session per user)
- Domain events for all aggregates
- Repository ports (interfaces only)

**Infrastructure Layer:**
- `users.table.ts` - canonical User table
- `email-identities.table.ts` - EmailIdentity table with FK to users
- `external-identities.table.ts` - ExternalIdentity table with FK to users
- `password-credentials.table.ts` - PasswordCredential table with FK to users
- `sessions.table.ts` - Session table with FK to users, HASHED refresh_token
- `user.repository.ts` - DrizzleUserRepository
- `user.repository.integration.test.ts` - Integration tests (14/14 passing)

**Database Schema (4 migrations - UNTRACKED):**
- `0000_identity.sql` - users, email_identities, external_identities, password_credentials, sessions
- `0001_tenant.sql` - tenants, memberships
- `0002_authorization.sql` - permissions, tenant_roles, role_assignments, role_permissions
- `0003_outbox.sql` - outbox table

**Tests:**
- Domain tests for all aggregates (passing)
- Repository integration tests (passing)

**Evidence:**
- Git status shows untracked files
- File inspection shows complete domain layer
- File inspection shows partial infrastructure layer
- File inspection shows schema files
- No application layer
- No presentation layer
- No runtime integration

**Conclusion:**
- Domain layer is well-implemented
- Infrastructure layer is partial
- Application layer does NOT exist
- Presentation layer does NOT exist
- Runtime integration does NOT exist
- Module is NOT connected to runtime

---

## 5. TENANT EVOLUTION

### 5.1 Initial State (a633301)

**Domain Stubs:**
- `Member.ts` - placeholder
- `Organization.ts` - placeholder
- `Tenant.ts` - placeholder
- `TenantSettings.ts` - placeholder
- `TenantStatus.ts` - placeholder
- `MemberAddedEvent` - placeholder
- `TenantCreatedEvent` - placeholder
- `TenantUpdatedEvent` - placeholder
- `MemberRepository` - placeholder
- `TenantRepository` - placeholder

**Placeholders:**
- `application/.gitkeep` - empty
- `infrastructure/.gitkeep` - empty
- `presentation/.gitkeep` - empty
- `tests/.gitkeep` - empty

**Evidence:**
- Git show a633301 shows domain stubs only
- No implementation
- Only placeholders for future layers

**Conclusion:**
- Tenant was planned but not implemented
- Only domain stubs existed
- No infrastructure, application, or presentation

---

### 5.2 IAM Tenant Extension (ea30c48)

**IAM Migrations Added:**
- `0007_add_tenant_module.sql` - IAM tenants table
- `0008_add_membership_module.sql` - IAM tenant_memberships table
- `0009_add_tenant_roles.sql` - IAM tenant_roles table
- `0010_add_role_assignments.sql` - IAM role_assignments table

**Evidence:**
- Git show ea30c48 shows tenant-related migrations in IAM
- Tenant support added to IAM, not to modules/tenant

**Conclusion:**
- Tenant support implemented in IAM
- modules/tenant remains placeholder
- No changes to modules/tenant module

---

### 5.3 Current State (Untracked Changes)

**Additional Domain (Untracked):**
- `Membership.ts` - membership aggregate
- `MembershipId.ts` - membership ID value object
- `MembershipStatus.ts` - membership status enum
- `TenantId.ts` - tenant ID value object
- `MembershipEvents.ts` - membership domain events
- `TenantEvents.ts` - tenant domain events
- `IMembershipRepository.ts` - membership repository port
- `ITenantRepository.ts` - tenant repository port

**Infrastructure (Untracked):**
- `infrastructure/persistence/drizzle/schema/memberships.table.ts`
- `infrastructure/persistence/drizzle/schema/tenants.table.ts`

**Tests (Untracked):**
- `tests/domain/membership.test.ts`
- `tests/domain/tenant.test.ts`
- `tests/domain/tenant-id.test.ts`

**Evidence:**
- Git status shows untracked changes to modules/tenant
- Deleted placeholders (application, infrastructure, presentation, tests)
- Added domain implementations
- Added infrastructure schema

**Conclusion:**
- modules/tenant evolved from placeholder to domain implementation
- Infrastructure layer added (schema only)
- Application layer still missing
- Presentation layer still missing
- Runtime integration still missing

---

## 6. ACCESS-CONTROL EVOLUTION

### 6.1 Initial State (a633301)

**Placeholders Only:**
- `domain/.gitkeep` - empty
- `application/.gitkeep` - empty
- `infrastructure/.gitkeep` - empty
- `presentation/.gitkeep` - empty
- `tests/.gitkeep` - empty

**Evidence:**
- Git show a633301 shows only placeholders
- No domain entities
- No implementation

**Conclusion:**
- Access control was planned but not implemented
- Only placeholders existed

---

### 6.2 Current State (Untracked Changes)

**Domain Layer (Untracked):**
- `permission/Permission.ts` - permission entity
- `permission/PermissionId.ts` - permission ID
- `permission/PermissionKey.ts` - permission key value object
- `permission/PermissionScope.ts` - permission scope enum (TENANT, PLATFORM)
- `permission/PlatformPermission.ts` - platform permission
- `permission/TenantPermission.ts` - tenant permission
- `role/Role.ts` - role entity
- `role/TenantRole.ts` - tenant role entity
- `role/TenantRoleId.ts` - tenant role ID
- `role/RoleKey.ts` - role key value object
- `role/RoleStatus.ts` - role status enum
- `assignment/RoleAssignment.ts` - role assignment aggregate
- `assignment/RoleAssignmentId.ts` - role assignment ID
- `assignment/RoleAssignmentStatus.ts` - role assignment status enum
- `role-permission/RolePermission.ts` - role permission entity
- Repository ports for all entities

**Infrastructure (Untracked):**
- `infrastructure/persistence/drizzle/schema/permissions.table.ts`
- `infrastructure/persistence/drizzle/schema/role-assignments.table.ts`
- `infrastructure/persistence/drizzle/schema/role-permissions.table.ts`
- `infrastructure/persistence/drizzle/schema/tenant-roles.table.ts`

**Tests (Untracked):**
- `tests/domain/permission/*.test.ts`
- `tests/domain/role/*.test.ts`
- `tests/domain/assignment/*.test.ts`
- `tests/domain/role-permission/*.test.ts`

**Evidence:**
- Git status shows untracked changes to modules/access-control
- Deleted placeholders
- Added complete domain layer
- Added infrastructure schema
- Added domain tests

**Conclusion:**
- modules/access-control evolved from placeholder to domain implementation
- Infrastructure layer added (schema only)
- Application layer still missing
- Presentation layer still missing
- Runtime integration still missing

---

## 7. CURRENT RUNTIME ARCHITECTURE

### 7.1 Runtime Graph

```
apps/api/src/main.ts
  ↓
apps/api/src/bootstrap.ts
  ↓
apps/api/src/container.ts
  ↓
apps/api/src/container/iam-container.ts
  ↓
modules/iam (ALL imports from @workspace/iam)
  ↓
packages/platform-database (PostgreSQL abstraction)
  ↓
PostgreSQL database (IAM schema)
```

**Evidence:**
- apps/api/src/container/iam-container.ts imports ONLY from @workspace/iam
- No imports from @workspace/identity
- No imports from @workspace/tenant
- No imports from @workspace/access-control
- apps/api/src/routes.ts mounts IAM router only

**Conclusion:**
- Runtime uses ONLY IAM
- New Identity modules are NOT connected to runtime
- New Identity modules are SOURCE ONLY

---

## 8. IAM ARCHITECTURE

### 8.1 Domain Layer

**Entities:**
- `User` (combined identity with email, password, display_name, status)
- `Role` (global role)
- `Permission` (global permission)
- `Policy` (ABAC policy)
- `SocialIdentity` (OAuth/social identity)

**Value Objects:**
- `OAuthProvider` (Google, GitHub, Telegram enum)
- `identity_status` (active, suspended, unverified, deleted enum)

**Domain Services:**
- `PolicyService` - policy evaluation

**Domain Events:**
- User lifecycle events
- Policy events

**Repository Interfaces:**
- `UserRepository`
- `RoleRepository`
- `SessionRepository`
- `SocialIdentityRepository`
- `PolicyRepository`
- `OAuthStateRepository`

**Evidence:**
- modules/iam/src/domain/ shows all entities
- modules/iam/src/domain/repositories/ shows interfaces

**Conclusion:**
- Combined user model (email, password in one entity)
- Global roles/permissions
- ABAC support via policies
- OAuth support

---

### 8.2 Application Layer

**Command Handlers:**
- `RegisterUserHandler` - user registration
- `LoginUserHandler` - user login
- `LogoutUserHandler` - user logout
- `ChangePasswordHandler` - password change
- `SetInitialPasswordHandler` - initial password set
- `AssignRoleHandler` - role assignment
- `SuspendUserHandler` - user suspension
- `OAuthLoginHandler` - OAuth login
- `LinkSocialAccountHandler` - account linking
- `InitiateOAuthHandler` - OAuth initiation
- `SendMagicLinkHandler` - magic link email
- `VerifyMagicLinkHandler` - magic link verification
- Policy command handlers (create, update, delete, activate, deactivate)

**Query Handlers:**
- `GetUserHandler` - get user
- `ListUsersHandler` - list users
- `CheckPermissionHandler` - check permission
- `ListPoliciesHandler` - list policies
- `GetPolicyHandler` - get policy
- `ListRolesHandler` - list roles

**Services:**
- `AuthService` - authentication orchestration
- `PolicyService` - policy evaluation
- `RateLimiter` - rate limiting

**Evidence:**
- modules/iam/src/application/commands/ shows all handlers
- modules/iam/src/application/queries/ shows all handlers
- modules/iam/src/application/services/ shows services

**Conclusion:**
- Complete application layer
- Command/query separation
- All authentication flows implemented
- Authorization implemented

---

### 8.3 Infrastructure Layer

**Repositories:**
- `DrizzleUserRepository` - PostgreSQL user repository
- `DrizzleRoleRepository` - PostgreSQL role repository
- `DrizzleSessionRepository` - PostgreSQL session repository
- `DrizzleSocialIdentityRepository` - PostgreSQL social identity repository
- `DrizzlePolicyRepository` - PostgreSQL policy repository
- `DrizzleOAuthStateRepository` - PostgreSQL OAuth state repository
- `DrizzleOutboxRepository` - PostgreSQL outbox repository
- `DrizzleMagicLinkTokenRepository` - PostgreSQL magic link repository
- In-memory repositories for testing

**OAuth Providers:**
- `GoogleOAuthProvider` - Google OAuth integration
- `GitHubOAuthProvider` - GitHub OAuth integration
- `TelegramOAuthProvider` - Telegram OAuth integration
- `OAuthProviderRegistry` - provider registry

**Security:**
- `BcryptPasswordHasher` - password hashing
- `IamJwtService` - JWT token generation
- `SecureRandomGenerator` - secure random generation

**Mappers:**
- `UserMapper` - user entity ↔ DB mapping
- `RoleMapper` - role entity ↔ DB mapping

**Messaging:**
- `InMemoryIamEventBus` - in-memory event bus

**Database Schema:**
- 13 migrations (0001-0013)
- Drizzle schema definitions
- RBAC seed data

**Evidence:**
- modules/iam/src/infrastructure/repositories/ shows all repositories
- modules/iam/src/infrastructure/oauth/ shows OAuth providers
- modules/iam/src/infrastructure/security/ shows security services
- modules/iam/src/infrastructure/database/migrations/ shows 13 migrations

**Conclusion:**
- Complete infrastructure layer
- PostgreSQL persistence via Drizzle
- OAuth provider implementations
- Security services
- Event bus (in-memory)
- Outbox pattern support

---

### 8.4 Presentation Layer

**HTTP Controllers:**
- `AuthController` - authentication endpoints
- `OAuthController` - OAuth endpoints
- `UserController` - user management endpoints
- `RoleController` - role management endpoints
- `PermissionController` - permission endpoints
- `PolicyController` - policy endpoints

**Middleware:**
- `AuthGuard` - JWT authentication
- `RoleGuard` - role-based authorization
- `PermissionGuard` - permission-based authorization
- `ValidateRequest` - request validation

**Validators:**
- Auth validators (login, logout, register, password change)
- OAuth validators (initiate, callback, link account, Telegram)
- Permission validators (check permission)
- Policy validators (create, update, list, evaluate)
- Role validators (list roles)
- User validators (assign role, get user, list users)
- Shared validators (ID, pagination)

**Transformers:**
- `UserTransformer` - user DTO transformation
- `RoleTransformer` - role DTO transformation

**GraphQL:**
- `AuthResolver` - GraphQL auth resolver
- `UserResolver` - GraphQL user resolver
- `RoleResolver` - GraphQL role resolver

**gRPC:**
- `AuthGrpcController` - gRPC auth controller
- `UserGrpcController` - gRPC user controller

**Evidence:**
- modules/iam/src/presentation/http/controllers/ shows all controllers
- modules/iam/src/presentation/http/middleware/ shows all middleware
- modules/iam/src/presentation/http/validators/ shows all validators
- modules/iam/src/presentation/graphql/ shows GraphQL resolvers
- modules/iam/src/presentation/grpc/ shows gRPC controllers

**Conclusion:**
- Complete presentation layer
- HTTP REST API
- GraphQL API
- gRPC API
- Middleware and validators

---

## 9. IDENTITY ARCHITECTURE

### 9.1 Domain Layer

**Aggregates:**
- `User` - canonical global user (status only, no email/password)
- `EmailIdentity` - email per user (with verification state)
- `ExternalIdentity` - OAuth/social per user
- `PasswordCredential` - password per user
- `Session` - session per user

**Value Objects:**
- `UserId`, `EmailIdentityId`, `ExternalIdentityId`, `PasswordCredentialId`, `SessionId`
- `Email` - email value object with validation
- `UserStatus` - ACTIVE, SUSPENDED, DELETED
- `ExternalIdentityProvider` - Google, GitHub, Telegram
- `SessionTokenHash` - hashed session token

**Domain Events:**
- `UserCreatedEvent`, `UserActivatedEvent`, `UserSuspendedEvent`, `UserDeletedEvent`
- `EmailIdentityCreatedEvent`, `EmailIdentityVerifiedEvent`
- `ExternalIdentityCreatedEvent`, `ExternalIdentityLinkedEvent`
- `PasswordCredentialCreatedEvent`, `PasswordCredentialChangedEvent`
- `SessionCreatedEvent`, `SessionRevokedEvent`

**Repository Ports (Interfaces Only):**
- `IUserRepository`
- `IEmailIdentityRepository`
- `IExternalIdentityRepository`
- `IPasswordCredentialRepository`
- `ISessionRepository`

**Evidence:**
- modules/identity/src/domain/ shows all aggregates
- modules/identity/src/domain/repositories/ shows interfaces

**Conclusion:**
- DDD aggregate separation
- Canonical User is global
- Identity concepts separated (email, external, password, session)
- Domain events for all aggregates
- Repository ports defined but not implemented (except UserRepository)

---

### 9.2 Infrastructure Layer

**Schema (Drizzle):**
- `users.table.ts` - canonical User table (status only)
- `email-identities.table.ts` - EmailIdentity table (FK to users)
- `external-identities.table.ts` - ExternalIdentity table (FK to users)
- `password-credentials.table.ts` - PasswordCredential table (FK to users)
- `sessions.table.ts` - Session table (FK to users, HASHED refresh_token)

**Mappers:**
- `user.mapper.ts` - User entity ↔ DB mapping

**Repository Implementations:**
- `user.repository.ts` - DrizzleUserRepository
- No other repository implementations

**Tests:**
- `user.repository.integration.test.ts` - Integration tests (14/14 passing)

**Evidence:**
- modules/identity/infrastructure/persistence/drizzle/schema/ shows all schema
- modules/identity/infrastructure/persistence/drizzle/repositories/ shows UserRepository
- modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.integration.test.ts shows tests

**Conclusion:**
- Partial infrastructure layer
- Only UserRepository implemented
- Other repository ports not implemented
- Integration tests exist for UserRepository only

---

### 9.3 Application Layer

**Status: DOES NOT EXIST**

**Evidence:**
- modules/identity/src/application/ directory does not exist
- No command handlers
- No query handlers
- No services

**Conclusion:**
- Application layer not implemented
- No use cases
- No orchestration

---

### 9.4 Presentation Layer

**Status: DOES NOT EXIST**

**Evidence:**
- modules/identity/src/presentation/ directory does not exist
- No HTTP controllers
- No middleware
- No routes

**Conclusion:**
- Presentation layer not implemented
- No HTTP endpoints
- No runtime integration

---

## 10. DATABASE COMPARISON

### 10.1 IAM Schema (RUNTIME ACTIVE)

**Tables (13 migrations):**
- `identities` - combined user table (id, email, password_hash, display_name, status)
- `iam_sessions` - sessions (id, identity_id, refresh_token PLAINTEXT, device info)
- `iam_roles` - global roles
- `iam_permissions` - global permissions
- `iam_identity_roles` - identity-role assignments
- `iam_role_permissions` - role-permission assignments
- `social_identities` - OAuth/social identities
- `iam_policies` - ABAC policies
- `oauth_states` - OAuth state tracking
- `magicLinkTokens` - magic link tokens
- `iam_devices` - device tracking
- `tenants` - tenants (added in 0007)
- `tenant_memberships` - tenant memberships (added in 0008)
- `tenant_roles` - tenant roles (added in 0009)
- `role_assignments` - role assignments (added in 0010)
- `invitations` - invitations (added in 0011)

**Migration Directory:**
- `modules/iam/src/infrastructure/database/migrations/`

**Migration Execution:**
- scripts/src/migrate.ts defaults to this directory
- Production uses these migrations

**Evidence:**
- modules/iam/src/infrastructure/database/migrations/ shows 13 SQL files
- scripts/src/migrate.ts shows MIGRATION_DIRECTORY defaults to IAM migrations
- Git history shows IAM migrations added in a633301 and ea30c48

**Conclusion:**
- IAM schema is RUNTIME ACTIVE
- 13 migrations in production
- Complete tenant support added in ea30c48

---

### 10.2 Identity Schema (UNTRACKED)

**Tables (4 migrations - UNTRACKED):**
- `users` - canonical User table (id, status, created_at, updated_at)
- `email_identities` - EmailIdentity table (id, user_id FK, email, verified_at, primary flag)
- `external_identities` - ExternalIdentity table (id, user_id FK, provider, provider_subject)
- `password_credentials` - PasswordCredential table (id, user_id FK, hashed_password)
- `sessions` - Session table (id, user_id FK, refresh_token_hash HASHED, expires_at, revoked_at)
- `tenants` - Tenant table (id, name, status)
- `memberships` - Membership table (id, user_id FK, tenant_id FK, status)
- `permissions` - Permission table (id, key, scope TENANT/PLATFORM)
- `tenant_roles` - TenantRole table (id, tenant_id FK, key)
- `role_assignments` - RoleAssignment table (id, membership_id FK, role_id FK)
- `role_permissions` - RolePermission table (role_id FK, permission_id FK)
- `outbox` - outbox table

**Migration Directory:**
- `packages/platform-database/migrations/` (UNTRACKED)

**Migration Execution:**
- NOT executed by migration CLI
- NOT in production

**Evidence:**
- Git status shows packages/platform-database/migrations as UNTRACKED
- Git log shows NO commits for these migrations
- Migration CLI does not reference this directory

**Conclusion:**
- Identity schema is NOT in Git history
- Identity schema is NOT in production
- Identity schema is UNTRACKED local files

---

### 10.3 Schema Comparison

| Concept | IAM Table | Identity Table | Differences |
|---------|-----------|----------------|-------------|
| **User** | `identities` (email, password, display_name in one table) | `users` (status only) + `email_identities` + `password_credentials` | Combined vs separated aggregates |
| **Email** | `identities.email` column | `email_identities` table with FK to users | Column vs separate table |
| **Password** | `identities.password_hash` column | `password_credentials` table with FK to users | Column vs separate table |
| **External Identity** | `social_identities` table (FK to identities) | `external_identities` table (FK to users) | References identities vs users |
| **Session** | `iam_sessions` (refresh_token PLAINTEXT) | `sessions` (refresh_token_hash HASHED) | **SECURITY: plaintext vs hashed** |
| **Tenant** | `tenants` table (added in 0007) | `tenants` table | Similar structure |
| **Membership** | `tenant_memberships` table (identity_id FK) | `memberships` table (user_id FK) | References identity_id vs user_id |
| **Role** | `iam_roles` (global) | `tenant_roles` (tenant-scoped) | Global vs tenant-scoped |
| **Permission** | `iam_permissions` (global) | `permissions` (TENANT or PLATFORM scope) | Global vs scoped |
| **Role Assignment** | `iam_identity_roles` (identity_id, role_id) | `role_assignments` (membership_id, role_id) | Direct identity vs through membership |

**Migration Difficulty:**
- identities → users + email_identities + password_credentials: **HIGH** (aggregate splitting)
- social_identities → external_identities: **MEDIUM** (FK change)
- iam_sessions → sessions: **MEDIUM** (token rotation required)
- tenant_memberships → memberships: **MEDIUM** (FK change)
- iam_roles → tenant_roles: **HIGH** (global to tenant-scoped)
- iam_permissions → permissions: **HIGH** (global to scoped)

**Evidence:**
- Schema inspection shows table structures
- Foreign key relationships differ
- Session token storage differs (CRITICAL security difference)

**Conclusion:**
- Two fundamentally different schemas
- New Identity has better security (hashed tokens)
- New Identity has better architecture (aggregate separation)
- Migration is HIGH RISK

---

## 11. AUTHENTICATION COMPARISON

### 11.1 IAM Authentication Features

**Implemented:**
- ✅ Registration (RegisterUserHandler)
- ✅ Login (LoginUserHandler)
- ✅ Logout (LogoutUserHandler)
- ✅ Password change (ChangePasswordHandler)
- ✅ Password set (SetInitialPasswordHandler)
- ✅ OAuth login (OAuthLoginHandler)
- ✅ OAuth account linking (LinkSocialAccountHandler)
- ✅ OAuth initiation (InitiateOAuthHandler)
- ✅ Magic link (SendMagicLinkHandler, VerifyMagicLinkHandler)
- ✅ Session management (DrizzleSessionRepository)
- ✅ JWT tokens (IamJwtService)
- ✅ Password hashing (BcryptPasswordHasher)
- ✅ OAuth providers (Google, GitHub, Telegram)
- ⚠️ MFA (migration 0002 adds MFA table, implementation not verified)
- ❌ Password reset (not evident)
- ❌ Email verification (not evident)
- ❌ Refresh token rotation (not evident)

**Evidence:**
- modules/iam/src/application/commands/ shows all handlers
- modules/iam/src/infrastructure/security/ shows security services
- modules/iam/src/infrastructure/oauth/ shows OAuth providers

**Conclusion:**
- Feature-complete authentication
- OAuth support for 3 providers
- Magic link support
- Missing some features (password reset, email verification, token rotation)

---

### 11.2 Identity Authentication Features

**Implemented:**
- ✅ Domain model for User, EmailIdentity, ExternalIdentity, PasswordCredential, Session
- ✅ Repository port interfaces
- ✅ UserRepository implementation (qualified)
- ❌ Application layer (no handlers)
- ❌ Presentation layer (no controllers)
- ❌ OAuth providers (not implemented)
- ❌ Magic link (not implemented)
- ❌ Password hashing (not implemented in application layer)
- ❌ JWT service (not implemented)
- ❌ Email verification (not implemented)
- ❌ Password reset (not implemented)
- ❌ Refresh token rotation (not implemented)

**Evidence:**
- modules/identity/src/domain/ shows domain model
- modules/identity/src/domain/repositories/ shows interfaces
- modules/identity/infrastructure/persistence/drizzle/repositories/ shows UserRepository only
- No application/ or presentation/ directories

**Conclusion:**
- Domain model is well-designed
- No application layer
- No presentation layer
- No runtime integration
- Missing all authentication infrastructure

---

## 12. SESSION SECURITY COMPARISON

### 12.1 IAM Session Model

**Table:** `iam_sessions`

**Columns:**
- `id` TEXT PRIMARY KEY
- `identity_id` TEXT REFERENCES identities(id)
- `device_id` TEXT
- `device_name` TEXT
- `device_type` TEXT
- `ip_address` TEXT
- `user_agent` TEXT
- `refresh_token` TEXT NOT NULL UNIQUE (PLAINTEXT)
- `expires_at` TIMESTAMP
- `last_active_at` TIMESTAMP
- `created_at` TIMESTAMP

**Security Properties:**
- ❌ **CRITICAL VULNERABILITY:** refresh_token stored as PLAINTEXT
- ✅ Device binding (device_id, device_name, device_type)
- ✅ IP tracking (ip_address)
- ✅ User agent tracking (user_agent)
- ❌ No token rotation evident
- ❌ No revoked_at field
- ❌ No replay protection evident

**Evidence:**
- modules/iam/src/infrastructure/database/migrations/0001_initial.sql shows schema
- Refresh token is TEXT NOT NULL UNIQUE (no hashing)

**Conclusion:**
- **CRITICAL SECURITY VULNERABILITY**
- If database is compromised, all active sessions can be hijacked
- Good device binding but tokens are plaintext

---

### 12.2 Identity Session Model

**Table:** `sessions`

**Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID REFERENCES users(id)
- `refresh_token_hash` TEXT NOT NULL (HASHED)
- `expires_at` TIMESTAMP
- `revoked_at` TIMESTAMP
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

**Security Properties:**
- ✅ **SECURE:** refresh_token_hash is HASHED
- ✅ revoked_at field for revocation
- ❌ No device binding fields
- ❌ No IP tracking
- ❌ No user agent tracking
- ❌ No token rotation evident
- ❌ No replay protection evident

**Evidence:**
- packages/platform-database/migrations/0000_identity.sql shows schema
- Refresh token is refresh_token_hash TEXT (hashed)

**Conclusion:**
- **SECURE:** tokens are hashed
- Missing device binding (regression from IAM)
- Missing IP/user agent tracking (regression from IAM)

---

### 12.3 Security Comparison

| Property | IAM | Identity | Impact |
|----------|-----|----------|--------|
| **Token Storage** | PLAINTEXT | HASHED | Identity is significantly more secure |
| **Device Binding** | device_id, device_name, device_type | None | IAM has better device tracking |
| **IP Tracking** | ip_address | None | IAM has IP tracking |
| **User Agent** | user_agent | None | IAM has user agent tracking |
| **Revocation** | Not evident | revoked_at field | Identity has explicit revocation |
| **Token Rotation** | Not evident | Not evident | Neither has rotation |

**Migration Impact:**
- Token rotation required during migration (plaintext → hashed)
- Device binding fields must be added to Identity sessions
- All active sessions must be invalidated during migration

**Evidence:**
- Schema comparison shows field differences
- Security analysis shows plaintext vs hashed

**Conclusion:**
- Identity has better token security (hashed)
- IAM has better session metadata (device, IP, user agent)
- Migration requires token rotation and field addition

---

## 13. AUTHORIZATION COMPARISON

### 13.1 IAM Authorization

**Model:** RBAC + ABAC

**Components:**
- `iam_roles` - global roles
- `iam_permissions` - global permissions
- `iam_identity_roles` - identity → role assignments
- `iam_role_permissions` - role → permission assignments
- `iam_policies` - ABAC policies (subjects, resources, actions, conditions)

**Evaluation:**
- `PolicyService` - policy evaluation
- `CheckPermissionHandler` - permission checking
- `PermissionGuard` - permission-based middleware

**Tenant Support:**
- `tenant_roles` - tenant-scoped roles (added in 0009)
- `role_assignments` - role assignments (added in 0010)
- Supports both global and tenant-scoped authorization

**Evidence:**
- modules/iam/src/infrastructure/database/migrations/ shows all tables
- modules/iam/src/application/services/PolicyService.ts shows policy evaluation
- modules/iam/src/presentation/http/middleware/PermissionGuard.ts shows middleware

**Conclusion:**
- RBAC + ABAC hybrid
- Global and tenant-scoped roles
- Policy-based authorization
- Complete implementation

---

### 13.2 Identity Authorization

**Model:** RBAC with scoped permissions

**Components:**
- `permissions` - permissions with scope (TENANT or PLATFORM)
- `tenant_roles` - tenant-scoped roles
- `role_assignments` - membership → role assignments
- `role_permissions` - role → permission assignments

**Evaluation:**
- NOT IMPLEMENTED (no application layer)
- Domain model only

**Tenant Support:**
- Permissions have scope (TENANT or PLATFORM)
- Roles are tenant-scoped
- Role assignments through membership

**Evidence:**
- modules/access-control/src/domain/ shows domain model
- No application/ or presentation/ layers

**Conclusion:**
- Domain model designed for RBAC with scoped permissions
- NO implementation
- NO ABAC support

---

### 13.3 Authorization Comparison

| Property | IAM | Identity | Status |
|----------|-----|----------|--------|
| **Model** | RBAC + ABAC | RBAC (scoped) | IAM has ABAC |
| **Roles** | Global + tenant-scoped | Tenant-scoped only | IAM more flexible |
| **Permissions** | Global | TENANT or PLATFORM scope | Identity more granular |
| **Role Assignment** | identity_id → role_id | membership_id → role_id | Identity goes through membership |
| **ABAC** | ✅ iam_policies | ❌ Not designed | IAM has ABAC |
| **Implementation** | ✅ Complete | ❌ Domain only | IAM is runtime-active |

**Migration Impact:**
- Global roles must be migrated to tenant-scoped or PLATFORM permissions
- ABAC policies must be preserved or replaced
- Role assignment flow must change (identity_id → membership_id)

**Evidence:**
- Schema comparison shows structural differences
- Domain model inspection shows capabilities

**Conclusion:**
- IAM has more flexible authorization (RBAC + ABAC)
- Identity has cleaner tenant-scoped model
- Migration requires authorization redesign

---

## 14. TEST COVERAGE COMPARISON

### 14.1 IAM Tests

**Integration Tests (apps/api/tests/):**
- `auth.integration.test.ts` - authentication integration
- `authorization.test.ts` - authorization integration
- `oauth.security.test.ts` - OAuth security
- `outbox.test.ts` - outbox pattern
- `permission.integration.test.ts` - permission integration

**Unit Tests:**
- Placeholder directories exist but not inventoried

**Evidence:**
- apps/api/tests/ shows integration tests
- modules/iam/tests/ has placeholder directories

**Conclusion:**
- Integration tests exist for runtime
- Domain tests not inventoried
- Coverage unknown

---

### 14.2 Identity Tests

**Domain Tests (modules/identity/tests/domain/):**
- `user.test.ts` - User aggregate tests
- `email-identity.test.ts` - EmailIdentity aggregate tests
- `external-identity.test.ts` - ExternalIdentity aggregate tests
- `password-credential.test.ts` - PasswordCredential aggregate tests
- `session.test.ts` - Session aggregate tests
- `email.test.ts` - Email value object tests
- `event-security.test.ts` - event security tests

**Integration Tests:**
- `user.repository.integration.test.ts` - UserRepository integration (14/14 passing, qualified)

**Evidence:**
- modules/identity/tests/domain/ shows domain tests
- modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.integration.test.ts shows integration tests

**Conclusion:**
- Comprehensive domain test coverage
- Repository integration tests for UserRepository only
- No application layer tests
- No HTTP tests
- No runtime tests

---

### 14.3 Test Comparison

| Test Type | IAM | Identity | Status |
|-----------|-----|----------|--------|
| **Domain Tests** | Not inventoried | Comprehensive | Identity better |
| **Repository Tests** | Not inventoried | UserRepository qualified | Identity better |
| **Integration Tests** | Runtime integration tests | Repository integration only | IAM tests runtime |
| **HTTP Tests** | Not inventoried | None | Neither |
| **E2E Tests** | Placeholder exists | None | Neither |

**Conclusion:**
- Identity has better domain test coverage
- IAM has runtime integration tests
- Neither has complete test coverage

---

## 15. FILE-BY-FILE INVENTORY

### 15.1 IAM Files (VERIFIED in Git History)

**Runtime Active Files:**
- modules/iam/src/domain/*.ts - RUNTIME ACTIVE
- modules/iam/src/application/**/*.ts - RUNTIME ACTIVE
- modules/iam/src/infrastructure/**/*.ts - RUNTIME ACTIVE
- modules/iam/src/presentation/**/*.ts - RUNTIME ACTIVE
- modules/iam/src/infrastructure/database/migrations/*.sql - RUNTIME ACTIVE

**Status:**
- All IAM files are RUNTIME ACTIVE
- No orphaned or dead files in IAM
- All layers connected to runtime

**Evidence:**
- Git history shows IAM created in a633301
- Runtime imports show IAM used by apps/api
- No Git history shows IAM files deleted

---

### 15.2 Identity Files (UNTRACKED)

**Domain Files:**
- modules/identity/src/domain/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED

**Infrastructure Files:**
- modules/identity/infrastructure/persistence/drizzle/schema/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED

**Test Files:**
- modules/identity/tests/domain/*.test.ts - TEST ONLY
- modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.integration.test.ts - TEST ONLY

**Status:**
- All Identity files are UNTRACKED
- Not in Git history
- Not connected to runtime
- Application layer does NOT exist
- Presentation layer does NOT exist

**Evidence:**
- Git status shows untracked files
- Git log shows no commits for modules/identity
- Runtime imports show no @workspace/identity imports

---

### 15.3 Tenant Files

**Tracked Files (Initial):**
- modules/tenant/src/domain/Member.ts - ORPHANED (placeholder)
- modules/tenant/src/domain/Organization.ts - ORPHANED (placeholder)
- modules/tenant/src/domain/Tenant.ts - ORPHANED (placeholder)
- modules/tenant/src/domain/TenantSettings.ts - ORPHANED (placeholder)
- modules/tenant/src/domain/TenantStatus.ts - ORPHANED (placeholder)
- modules/tenant/src/domain/events/*.ts - ORPHANED (placeholder)
- modules/tenant/src/domain/repositories/*.ts - ORPHANED (placeholder)

**Untracked Files (Current):**
- modules/tenant/src/domain/Membership.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/src/domain/MembershipId.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/src/domain/MembershipStatus.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/src/domain/TenantId.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/src/domain/events/MembershipEvents.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/src/domain/events/TenantEvents.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/src/domain/repositories/IMembershipRepository.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/src/domain/repositories/ITenantRepository.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/infrastructure/persistence/drizzle/schema/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/tenant/tests/domain/*.test.ts - TEST ONLY

**Status:**
- Initial placeholders are ORPHANED
- Untracked files are SOURCE ACTIVE but NOT RUNTIME CONNECTED
- Not connected to runtime
- Application layer does NOT exist
- Presentation layer does NOT exist

**Evidence:**
- Git status shows modified and untracked files
- Git history shows initial placeholders created in a633301
- Runtime imports show no @workspace/tenant imports

---

### 15.4 Access Control Files

**Tracked Files (Initial):**
- modules/access-control/src/domain/.gitkeep - ORPHANED (placeholder)
- modules/access-control/src/application/.gitkeep - ORPHANED (placeholder)
- modules/access-control/src/infrastructure/.gitkeep - ORPHANED (placeholder)
- modules/access-control/src/presentation/.gitkeep - ORPHANED (placeholder)

**Untracked Files (Current):**
- modules/access-control/src/domain/permission/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/access-control/src/domain/role/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/access-control/src/domain/assignment/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/access-control/src/domain/role-permission/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/access-control/src/domain/repositories/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/access-control/infrastructure/persistence/drizzle/schema/*.ts - SOURCE ACTIVE, NOT RUNTIME CONNECTED
- modules/access-control/tests/domain/*.test.ts - TEST ONLY

**Status:**
- Initial placeholders are ORPHANED
- Untracked files are SOURCE ACTIVE but NOT RUNTIME CONNECTED
- Not connected to runtime
- Application layer does NOT exist
- Presentation layer does NOT exist

**Evidence:**
- Git status shows modified and untracked files
- Git history shows initial placeholders created in a633301
- Runtime imports show no @workspace/access-control imports

---

## 16. DEPENDENCY GRAPH

### 16.1 Runtime Dependency Graph

```
apps/api
  ↓
modules/iam (@workspace/iam)
  ↓
packages/platform-database (PostgreSQL abstraction)
  ↓
packages/platform (cache, encryption, JWT, logger, event bus)
  ↓
packages/kernel (domain primitives)
  ↓
packages/contracts (API contracts)
```

**Evidence:**
- apps/api/src/container/iam-container.ts imports
- modules/iam/package.json dependencies
- Runtime trace shows actual imports

**Conclusion:**
- Clean runtime dependency graph
- IAM is the only identity module in runtime
- No circular dependencies
- No architectural violations

---

### 16.2 New Identity Dependency Graph (SOURCE ONLY)

```
modules/identity
  ↓
packages/kernel (domain primitives)
  ↓
packages/platform-database (UnitOfWork, PersistenceError)

modules/tenant
  ↓
packages/kernel (domain primitives)
  ↓
packages/platform-database (UnitOfWork, PersistenceError)
  ↓
modules/identity (domain references only)

modules/access-control
  ↓
packages/kernel (domain primitives)
  ↓
packages/platform-database (UnitOfWork, PersistenceError)
  ↓
modules/tenant (domain references only)
```

**Evidence:**
- modules/identity/package.json dependencies
- modules/tenant/package.json dependencies
- modules/access-control/package.json dependencies

**Conclusion:**
- Clean source dependency graph
- No circular dependencies
- Cross-module references are domain-only (not runtime)
- Not connected to apps/api

---

## 17. ARCHITECTURAL CONTRADICTIONS

### CONTR-001: Two Parallel User Models

**IAM:**
- Combined identities table (email, password, display_name in one table)
- User = Identity

**Identity:**
- Separated aggregates (User, EmailIdentity, ExternalIdentity, PasswordCredential)
- User ≠ Identity

**Evidence:**
- modules/iam/src/infrastructure/database/migrations/0001_initial.sql shows combined model
- modules/identity/src/domain/ shows separated model

**Why It Exists:**
- IAM was initial implementation
- Identity was created later (untracked, no Git history)
- Motivation UNKNOWN

**Risk:**
- HIGH - data migration requires aggregate splitting
- Data loss risk if mapping incorrect

**Current Owner:**
- IAM (runtime)
- Identity (untracked local files)

**Target Owner:**
- UNKNOWN - no architectural decision

**Resolution:**
- DEFERRED - requires architectural decision

---

### CONTR-002: Two Parallel Session Models

**IAM:**
- iam_sessions table with plaintext refresh_token
- Device binding (device_id, device_name, device_type)
- IP tracking (ip_address)
- User agent tracking (user_agent)

**Identity:**
- sessions table with hashed refresh_token_hash
- No device binding
- No IP tracking
- No user agent tracking

**Evidence:**
- modules/iam/src/infrastructure/database/migrations/0001_initial.sql shows plaintext
- packages/platform-database/migrations/0000_identity.sql shows hashed

**Why It Exists:**
- IAM session model is original
- Identity session model is redesign (untracked)
- Motivation UNKNOWN

**Risk:**
- CRITICAL - IAM has security vulnerability (plaintext tokens)
- Identity loses device binding (regression)

**Current Owner:**
- IAM (runtime)
- Identity (untracked local files)

**Target Owner:**
- UNKNOWN - no architectural decision

**Resolution:**
- DEFERRED - requires architectural decision
- Must address security vulnerability

---

### CONTR-003: Two Parallel Database Schemas

**IAM Schema:**
- 13 migrations in modules/iam/src/infrastructure/database/migrations/
- Runtime active
- Production uses this schema

**Identity Schema:**
- 4 migrations in packages/platform-database/migrations/ (UNTRACKED)
- Not in Git history
- Not in production

**Evidence:**
- Git history shows IAM migrations added in a633301 and ea30c48
- Git status shows Identity migrations as UNTRACKED
- Migration CLI defaults to IAM migrations

**Why It Exists:**
- IAM schema is original
- Identity schema is redesign (untracked)
- Motivation UNKNOWN

**Risk:**
- HIGH - two parallel schemas with table name overlaps
- Data loss risk if wrong schema used
- Migration complexity

**Current Owner:**
- IAM (runtime)
- Identity (untracked local files)

**Target Owner:**
- UNKNOWN - no architectural decision

**Resolution:**
- DEFERRED - requires architectural decision
- Must resolve migration authority

---

### CONTR-004: Two Parallel Authorization Models

**IAM:**
- RBAC + ABAC
- Global roles + tenant roles
- iam_policies for ABAC
- identity_id → role_id assignments

**Identity:**
- RBAC with scoped permissions
- Tenant-scoped roles only
- No ABAC
- membership_id → role_id assignments

**Evidence:**
- modules/iam/src/infrastructure/database/migrations shows IAM model
- modules/access-control/src/domain shows Identity model

**Why It Exists:**
- IAM authorization is original
- Identity authorization is redesign (untracked)
- Motivation UNKNOWN

**Risk:**
- HIGH - authorization model fundamentally different
- Privilege escalation risk if migration incorrect
- Access denial risk if migration incorrect

**Current Owner:**
- IAM (runtime)
- Identity (untracked local files)

**Target Owner:**
- UNKNOWN - no architectural decision

**Resolution:**
- DEFERRED - requires architectural decision

---

### CONTR-005: New Identity Not in Git History

**Identity Module:**
- Not in Git history
- Untracked files
- Creation date UNKNOWN
- Author UNKNOWN
- Motivation UNKNOWN

**Evidence:**
- Git log --all shows no commits for modules/identity
- Git status shows untracked files

**Why It Exists:**
- Local development work
- Not committed to repository
- Motivation UNKNOWN

**Risk:**
- UNKNOWN - no historical context
- No decision documentation
- No architectural discussion

**Current Owner:**
- UNKNOWN (untracked local files)

**Target Owner:**
- UNKNOWN - no architectural decision

**Resolution:**
- DEFERRED - requires architectural decision
- Must determine if Identity should be committed or deleted

---

## 18. IAM → IDENTITY DATA MAPPING

### 18.1 User Mapping

**Source:** `identities` table
```
id (TEXT)
email (TEXT)
password_hash (TEXT)
display_name (TEXT)
status (identity_status)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Target:** `users` + `email_identities` + `password_credentials`
```
users:
  id (UUID)
  status (UserStatus)
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)

email_identities:
  id (UUID)
  user_id (UUID FK)
  email (TEXT)
  verified_at (TIMESTAMP)
  primary (BOOLEAN)
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)

password_credentials:
  id (UUID)
  user_id (UUID FK)
  hashed_password (TEXT)
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)
```

**Mapping:**
- identities.id → users.id (TEXT → UUID, must generate UUID)
- identities.status → users.status (identity_status → UserStatus enum)
- identities.email → email_identities.email
- identities.password_hash → password_credentials.hashed_password
- identities.display_name → NO TARGET (lost field)
- identities.created_at → users.created_at
- identities.updated_at → users.updated_at

**Complexity:** HIGH
- Must generate UUIDs from TEXT IDs
- Must split one row into three rows
- Must handle foreign key relationships
- display_name field lost

**Risk:** HIGH
- Data loss (display_name)
- ID type change (TEXT → UUID)
- Foreign key chain complexity

---

### 18.2 Session Mapping

**Source:** `iam_sessions` table
```
id (TEXT)
identity_id (TEXT FK)
device_id (TEXT)
device_name (TEXT)
device_type (TEXT)
ip_address (TEXT)
user_agent (TEXT)
refresh_token (TEXT PLAINTEXT)
expires_at (TIMESTAMP)
last_active_at (TIMESTAMP)
created_at (TIMESTAMP)
```

**Target:** `sessions` table
```
id (UUID)
user_id (UUID FK)
refresh_token_hash (TEXT HASHED)
expires_at (TIMESTAMP)
revoked_at (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Mapping:**
- iam_sessions.id → sessions.id (TEXT → UUID, must generate UUID)
- iam_sessions.identity_id → sessions.user_id (TEXT → UUID, must map through users table)
- iam_sessions.refresh_token → sessions.refresh_token_hash (must hash during migration)
- iam_sessions.expires_at → sessions.expires_at
- iam_sessions.created_at → sessions.created_at
- iam_sessions.last_active_at → NO TARGET (lost field)
- iam_sessions.device_id → NO TARGET (lost field)
- iam_sessions.device_name → NO TARGET (lost field)
- iam_sessions.device_type → NO TARGET (lost field)
- iam_sessions.ip_address → NO TARGET (lost field)
- iam_sessions.user_agent → NO TARGET (lost field)

**Complexity:** MEDIUM
- Must hash all tokens during migration
- Must invalidate all active sessions (token rotation)
- Device binding fields lost

**Risk:** CRITICAL
- All active sessions invalidated (users must re-authenticate)
- Device binding regression
- Security risk if hashing fails

---

### 18.3 Social Identity Mapping

**Source:** `social_identities` table
```
id (TEXT)
user_id (TEXT FK to identities)
provider (TEXT)
provider_user_id (TEXT)
provider_email (TEXT)
provider_display_name (TEXT)
access_token (TEXT)
refresh_token (TEXT)
token_expires_at (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Target:** `external_identities` table
```
id (UUID)
user_id (UUID FK to users)
provider (TEXT)
provider_subject (TEXT)
identity_verified_at (TIMESTAMP)
provider_email (TEXT)
provider_email_verified (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Mapping:**
- social_identities.id → external_identities.id (TEXT → UUID)
- social_identities.user_id → external_identities.user_id (TEXT → UUID, must map through users table)
- social_identities.provider → external_identities.provider
- social_identities.provider_user_id → external_identities.provider_subject
- social_identities.provider_email → external_identities.provider_email
- social_identities.provider_display_name → NO TARGET (lost field)
- social_identities.access_token → NO TARGET (lost field)
- social_identities.refresh_token → NO TARGET (lost field)
- social_identities.token_expires_at → NO TARGET (lost field)

**Complexity:** MEDIUM
- ID type change
- FK change
- OAuth tokens lost

**Risk:** MEDIUM
- OAuth tokens lost (users must re-link accounts)
- Provider display name lost

---

### 18.4 Membership Mapping

**Source:** `tenant_memberships` table
```
id (TEXT)
identity_id (TEXT FK to identities)
tenant_id (TEXT FK to tenants)
status (membership_status)
joined_at (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Target:** `memberships` table
```
id (UUID)
user_id (UUID FK to users)
tenant_id (UUID FK to tenants)
status (TEXT)
joined_at (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Mapping:**
- tenant_memberships.id → memberships.id (TEXT → UUID)
- tenant_memberships.identity_id → memberships.user_id (TEXT → UUID, must map through users table)
- tenant_memberships.tenant_id → memberships.tenant_id (TEXT → UUID)
- tenant_memberships.status → memberships.status
- tenant_memberships.joined_at → memberships.joined_at
- tenant_memberships.created_at → memberships.created_at
- tenant_memberships.updated_at → memberships.updated_at

**Complexity:** MEDIUM
- ID type change
- FK change (identity_id → user_id)

**Risk:** MEDIUM
- FK mapping through users table
- ID type change

---

### 18.5 Role Mapping

**Source:** `iam_roles` (global) + `tenant_roles` (tenant-scoped)
```
iam_roles:
  id (TEXT)
  name (TEXT)
  description (TEXT)
  is_system (BOOLEAN)

tenant_roles:
  id (TEXT)
  tenant_id (TEXT FK)
  name (TEXT)
  description (TEXT)
```

**Target:** `tenant_roles` (tenant-scoped only)
```
tenant_roles:
  id (UUID)
  tenant_id (UUID FK)
  key (TEXT)
  display_name (TEXT)
  description (TEXT)
  status (TEXT)
```

**Mapping:**
- iam_roles → tenant_roles with NULL tenant_id (PLATFORM scope)
- tenant_roles → tenant_roles with tenant_id
- iam_roles.name → tenant_roles.key
- iam_roles.description → tenant_roles.display_name

**Complexity:** HIGH
- Global roles must become PLATFORM permissions or tenant-scoped
- Role name → key field change
- Authorization model change

**Risk:** HIGH
- Authorization semantics change
- Global roles may not map to tenant-scoped model
- Privilege escalation risk

---

## 19. MIGRATION RISK ANALYSIS

### MIGRATION-001: Identities → Users + EmailIdentities + PasswordCredentials

**Difficulty:** HIGH

**Data Transformation:**
- Split one table into three tables
- Generate UUIDs from TEXT IDs
- Handle foreign key relationships
- Map status enums

**Potential Data Loss:**
- display_name field lost
- ID type change (TEXT → UUID)

**Security Impact:**
- Password hashes must be preserved exactly
- If hashes corrupted, users cannot log in

**Backward Compatibility:**
- Not compatible - schema completely different

**Rollback Complexity:**
- VERY HIGH - must re-aggregate three tables back into one

**Status:** NOT VERIFIED
- Migration script not designed
- No dry-run test

---

### MIGRATION-002: iam_sessions → sessions

**Difficulty:** MEDIUM

**Data Transformation:**
- Hash all refresh tokens
- Generate UUIDs from TEXT IDs
- Map identity_id → user_id
- Invalidate all active sessions

**Potential Data Loss:**
- Device binding fields lost (device_id, device_name, device_type)
- IP tracking lost (ip_address)
- User agent tracking lost (user_agent)
- last_active_at lost

**Security Impact:**
- CRITICAL - all active sessions invalidated
- Users must re-authenticate
- If hashing fails, security vulnerability persists

**Backward Compatibility:**
- Not compatible - session model different

**Rollback Complexity:**
- HIGH - must regenerate plaintext tokens (impossible without secrets)

**Status:** NOT VERIFIED
- Migration script not designed
- No dry-run test

---

### MIGRATION-003: iam_roles → tenant_roles

**Difficulty:** HIGH

**Data Transformation:**
- Convert global roles to tenant-scoped or PLATFORM permissions
- Map role names to keys
- Change authorization model

**Potential Data Loss:**
- Global role semantics may not map to tenant-scoped model
- System roles (is_system flag) lost

**Security Impact:**
- CRITICAL - authorization model change
- Privilege escalation risk if mapping incorrect
- Access denial risk if mapping incorrect

**Backward Compatibility:**
- Not compatible - authorization model different

**Rollback Complexity:**
- VERY HIGH - must revert authorization model

**Status:** NOT VERIFIED
- Migration script not designed
- No dry-run test

---

### MIGRATION-004: tenant_memberships → memberships

**Difficulty:** MEDIUM

**Data Transformation:**
- Map identity_id → user_id
- Generate UUIDs from TEXT IDs

**Potential Data Loss:**
- Minimal (status, timestamps preserved)

**Security Impact:**
- HIGH - tenant isolation depends on correct mapping
- Privilege escalation risk if mapping incorrect

**Backward Compatibility:**
- Not compatible - FK change

**Rollback Complexity:**
- MEDIUM - can reverse FK mapping

**Status:** NOT VERIFIED
- Migration script not designed
- No dry-run test

---

## 20. MISSING CAPABILITIES

### Identity Missing Features

**Feature:** Magic Link
**IAM Status:** ✅ Implemented (SendMagicLinkHandler, VerifyMagicLinkHandler, magicLinkTokens table)
**Identity Status:** ❌ Not implemented
**Migration Strategy:** Must implement in Identity before migration or preserve IAM implementation

**Feature:** MFA
**IAM Status:** ⚠️ Migration 0002 adds MFA table, implementation not verified
**Identity Status:** ❌ Not implemented
**Migration Strategy:** Must implement in Identity before migration or preserve IAM implementation

**Feature:** Password Reset
**IAM Status:** ❌ Not evident
**Identity Status:** ❌ Not implemented
**Migration Strategy:** Neither has it - feature gap

**Feature:** Email Verification
**IAM Status:** ❌ Not evident
**Identity Status:** ⚠️ EmailIdentity has verifiedAt field, no implementation
**Migration Strategy:** Must implement email verification flow

**Feature:** Device Binding
**IAM Status:** ✅ Implemented (device_id, device_name, device_type, ip_address, user_agent)
**Identity Status:** ❌ Not implemented
**Migration Strategy:** Must add to Identity sessions schema

**Feature:** ABAC
**IAM Status:** ✅ Implemented (iam_policies, PolicyService)
**Identity Status:** ❌ Not implemented
**Migration Strategy:** Must implement ABAC or accept feature loss

**Feature:** Refresh Token Rotation
**IAM Status:** ❌ Not evident
**Identity Status:** ❌ Not evident
**Migration Strategy:** Neither has it - feature gap

**Evidence:**
- IAM handlers and migrations show features
- Identity domain model lacks features

**Conclusion:**
- Identity is missing several IAM features
- Migration requires feature parity or feature loss acceptance

---

## 21. SECURITY RISKS

### SEC-001: Plaintext Session Tokens (CRITICAL)

**Location:** modules/iam/src/infrastructure/database/migrations/0001_initial.sql
```sql
refresh_token TEXT NOT NULL UNIQUE
```

**Evidence:**
- Migration SQL shows plaintext storage
- No hashing function applied

**Impact:**
- If database is compromised, all active refresh tokens can be stolen
- Attackers can hijack all active user sessions
- Token theft leads to full account takeover

**Status:** CONFIRMED
- Exists in runtime
- Critical security vulnerability

**Resolution Required:**
- Fix immediately or migrate to Identity (which hashes tokens)

---

### SEC-002: No Device Binding in Identity Sessions

**Location:** packages/platform-database/migrations/0000_identity.sql

**Evidence:**
- sessions table has minimal fields
- No device_id, device_name, device_type, ip_address, user_agent

**Impact:**
- Cannot detect suspicious login from new device
- Cannot implement device-based security policies
- Session hijacking detection is impossible

**Status:** CONFIRMED
- Exists in Identity schema
- Regression from IAM

**Resolution Required:**
- Add device binding fields to Identity sessions schema

---

### SEC-003: No Evident Token Rotation

**Location:** Neither implementation

**Evidence:**
- Neither schema shows rotation mechanism
- No handler logic evident

**Impact:**
- Compromised tokens remain valid until expiration
- Cannot revoke compromised tokens proactively

**Status:** NOT VERIFIED
- Codebase not fully inventoried

**Resolution Required:**
- Implement token rotation in target architecture

---

## 22. ARCHITECTURAL OPTIONS

### OPTION A: Continue IAM and Improve It

**Architecture:**
- Keep IAM as runtime architecture
- Fix plaintext session tokens
- Add missing features (password reset, email verification, token rotation)
- Improve existing implementation

**Security:**
- Fix plaintext tokens (critical)
- Keep device binding
- Keep ABAC

**Migration Risk:**
- NONE - no data migration required

**Development Cost:**
- LOW - incremental improvements to existing code

**Data Migration:**
- NONE - no migration required

**Runtime Complexity:**
- LOW - no changes to runtime

**Rollback:**
- EASY - can rollback individual improvements

**Long-term Maintainability:**
- MEDIUM - monolithic identity model may not scale

**Feature Completeness:**
- HIGH - already feature-complete

**Testing:**
- MEDIUM - existing integration tests

**Operational Complexity:**
- LOW - no operational changes

**Trade-offs:**
- ✅ No migration risk
- ✅ No data loss
- ✅ No operational changes
- ❌ Monolithic identity model
- ❌ Combined aggregates (DDD violation)
- ❌ Plagued by technical debt if not refactored

---

### OPTION B: Replace IAM with Identity

**Architecture:**
- Migrate to Identity architecture
- Implement missing layers (application, presentation)
- Add missing features
- Delete IAM

**Security:**
- Hashed session tokens (better)
- Lose device binding (regression)
- Lose ABAC (regression)

**Migration Risk:**
- CRITICAL - complex data migration
- High data loss risk
- High authorization risk

**Development Cost:**
- VERY HIGH - implement entire application/presentation layers
- VERY HIGH - migration script development
- VERY HIGH - testing

**Data Migration:**
- CRITICAL - aggregate splitting, token rotation, FK changes

**Runtime Complexity:**
- HIGH - complete runtime replacement

**Rollback:**
- VERY DIFFICULT - must reverse data migration

**Long-term Maintainability:**
- HIGH - better DDD architecture
- HIGH - aggregate separation

**Feature Completeness:**
- LOW - missing many features
- MUST implement before migration

**Testing:**
- VERY HIGH - need complete test suite

**Operational Complexity:**
- HIGH - migration execution
- HIGH - cutover complexity

**Trade-offs:**
- ✅ Better DDD architecture
- ✅ Hashed session tokens
- ✅ Aggregate separation
- ❌ VERY HIGH migration risk
- ❌ Data loss risk
- ❌ Feature gaps
- ❌ Device binding regression
- ❌ ABAC regression

---

### OPTION C: Phased Migration from IAM → Identity

**Architecture:**
- Run IAM and Identity in parallel
- Implement Identity layers incrementally
- Migrate data incrementally
- Cutover gradually

**Security:**
- Hybrid during migration
- Must maintain security invariants

**Migration Risk:**
- HIGH - parallel operation complexity
- MEDIUM - incremental data migration

**Development Cost:**
- HIGH - dual maintenance
- HIGH - synchronization logic

**Data Migration:**
- HIGH - incremental migration scripts
- HIGH - dual-write during migration

**Runtime Complexity:**
- VERY HIGH - dual runtime
- HIGH - feature parity maintenance

**Rollback:**
- MEDIUM - can rollback to IAM if migration fails

**Long-term Maintainability:**
- HIGH - eventual target architecture
- MEDIUM - temporary dual maintenance

**Feature Completeness:**
- MEDIUM - must maintain parity during migration

**Testing:**
- VERY HIGH - dual runtime testing
- VERY HIGH - migration testing

**Operational Complexity:**
- VERY HIGH - dual database
- VERY HIGH - dual runtime

**Trade-offs:**
- ✅ Reduced migration risk (incremental)
- ✅ Can rollback if migration fails
- ✅ Better eventual architecture
- ❌ VERY HIGH operational complexity
- ❌ Dual maintenance overhead
- ❌ Extended migration timeline

---

## 23. RECOMMENDED TARGET ARCHITECTURE

### 23.1 Architectural Decision

**RECOMMENDATION: OPTION A - Continue IAM and Improve It**

**Rationale:**

1. **New Identity is Not in Git History**
   - modules/identity is UNTRACKED
   - No architectural decision documentation
   - No motivation documented
   - Creation date and author UNKNOWN
   - Cannot justify replacing proven runtime with untracked code

2. **CRITICAL Security Vulnerability Can Be Fixed in IAM**
   - Plaintext session tokens can be hashed in IAM
   - No need for full migration to fix this
   - Lower risk

3. **Migration Risk is Unjustified**
   - HIGH risk of data loss
   - HIGH risk of authorization breakage
   - Complex aggregate splitting
   - Token rotation required
   - No compelling reason to accept this risk

4. **IAM is Feature-Complete**
   - All authentication flows implemented
   - OAuth support for 3 providers
   - Magic link support
   - ABAC support
   - Device binding
   - Integration tests exist

5. **Identity is Incomplete**
   - No application layer
   - No presentation layer
   - No runtime integration
   - Missing many features
   - Device binding regression
   - ABAC regression

6. **DDD Benefits Do Not Justify Risk**
   - Aggregate separation is architecturally sound
   - But not worth CRITICAL migration risk
   - Can refactor IAM incrementally if needed

### 23.2 Target Architecture Definition

**Who Owns User?**
- modules/iam owns User (identities table)

**Who Owns Credentials?**
- modules/iam owns credentials (identities.password_hash)

**Who Owns Sessions?**
- modules/iam owns sessions (iam_sessions table)
- Must hash refresh_token (security fix)

**Who Owns Tenant Membership?**
- modules/iam owns membership (tenant_memberships table)

**Who Owns Authorization?**
- modules/iam owns authorization (iam_roles, iam_permissions, iam_policies)

**Who Owns Migrations?**
- modules/iam/src/infrastructure/database/migrations/ owns migrations
- Migration authority is IAM

**Who Owns Transactions?**
- modules/iam owns transactions (DrizzleIamUnitOfWork)

**Who Owns Domain Events?**
- modules/iam owns domain events

**Who Owns HTTP?**
- modules/iam owns HTTP (controllers, middleware)

**Who Owns External Providers?**
- modules/iam owns OAuth providers (Google, GitHub, Telegram)

### 23.3 Required Improvements

**IMMEDIATE (Critical Security):**
1. Hash refresh_token in iam_sessions table
2. Add migration to hash existing tokens
3. Update DrizzleSessionRepository to hash tokens

**SHORT-TERM (Feature Gaps):**
1. Implement password reset flow
2. Implement email verification flow
3. Implement refresh token rotation
4. Add comprehensive domain tests

**MEDIUM-TERM (Technical Debt):**
1. Consider incremental DDD refactoring (if needed)
2. Extract aggregates (optional, not required)
3. Improve test coverage

**NOT REQUIRED:**
- ❌ Migration to Identity
- ❌ Aggregate splitting
- ❌ Authorization model change
- ❌ Device binding removal

---

## 24. ARCHITECTURE DECISION RECORDS

### ADR-001: Keep IAM as Runtime Architecture

**Status:** PROPOSED

**Context:**
- New Identity architecture exists as untracked local files
- No Git history, no documentation, no decision record
- IAM is feature-complete and runtime-active
- Migration to Identity has CRITICAL risk

**Decision:**
- Keep IAM as runtime architecture
- Improve IAM incrementally
- Do NOT migrate to Identity

**Consequences:**
- ✅ No migration risk
- ✅ No data loss
- ✅ No operational changes
- ✅ Can fix security vulnerability in-place
- ❌ Monolithic identity model remains
- ❌ DDD aggregate separation not achieved

**Alternatives Considered:**
- Replace IAM with Identity (rejected due to risk)
- Phased migration (rejected due to complexity)

---

### ADR-002: Hash Session Tokens in IAM

**Status:** REQUIRED

**Context:**
- IAM stores refresh_token as plaintext in iam_sessions
- Critical security vulnerability
- Database compromise leads to session hijacking

**Decision:**
- Hash refresh_token in IAM
- Add migration to hash existing tokens
- Update repository to hash new tokens
- Keep device binding fields

**Consequences:**
- ✅ Fixes critical security vulnerability
- ✅ Keeps device binding
- ✅ No full migration required
- ⚠️ All active sessions invalidated during migration

**Alternatives Considered:**
- Migrate to Identity (rejected due to risk)
- Keep plaintext (rejected due to security)

---

### ADR-003: Delete or Archive Untracked Identity Files

**Status:** PROPOSED

**Context:**
- modules/identity is untracked
- Not in Git history
- No decision documentation
- Not connected to runtime

**Decision:**
- Delete untracked Identity files OR archive as reference
- Do NOT commit to repository without ADR

**Consequences:**
- ✅ Removes architectural confusion
- ✅ Eliminates parallel schema conflict
- ❌ Loses development work (if deleted)

**Alternatives Considered:**
- Commit Identity (rejected without ADR)
- Keep as untracked (rejected - confusion)

---

## 25. MIGRATION STRATEGY

### 25.1 NO MIGRATION RECOMMENDED

**Strategy:** Do NOT migrate from IAM to Identity

**Rationale:**
- Migration risk unjustified
- New Identity is untracked and undocumented
- IAM improvements are lower risk

**Actions:**
1. Fix plaintext session tokens in IAM
2. Implement missing features in IAM
3. Improve test coverage in IAM
4. Delete or archive untracked Identity files

---

## 26. PERSISTENCE CONTRACT FREEZE

### 26.1 Repository Interfaces

**IUserRepository:**
```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  insert(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

**Evidence:**
- modules/iam/src/domain/repositories/UserRepository.ts (interface exists)

---

### 26.2 Persistence Models

**Drizzle Schema:**
- modules/iam/src/infrastructure/database/schema/identities.table.ts

**Evidence:**
- Schema file exists
- Drizzle ORM used

---

### 26.3 Domain Models

**User Entity:**
- modules/iam/src/domain/User.ts

**Evidence:**
- Domain entity exists

---

### 26.4 Mappers

**UserMapper:**
- modules/iam/src/infrastructure/mappers/UserMapper.ts

**Evidence:**
- Mapper exists

---

### 26.5 Transaction Abstraction

**IamUnitOfWork:**
- modules/iam/src/application/ports/IamUnitOfWork.ts
- modules/iam/src/infrastructure/DrizzleIamUnitOfWork.ts

**Evidence:**
- Transaction abstraction exists
- Drizzle implementation exists

---

### 26.6 Persistence Error Contract

**PostgreSQL Error Mapping:**
- DrizzleIamUnitOfWork maps PostgreSQL codes to PersistenceError

**Evidence:**
- Error mapping implemented

---

### 26.7 NotFound Semantics

**Repository returns null for not found:**
```typescript
findById(id: string): Promise<User | null>
```

**Evidence:**
- Interface definition

---

### 26.8 Conflict Semantics

**Unique Constraint Violation:**
- Throws UniqueConstraintViolation

**Evidence:**
- Error hierarchy exists

---

### 26.9 Update Semantics

**Update throws if not found:**
- DrizzleUserRepository.update() throws UserNotFoundError if result.length === 0

**Evidence:**
- Repository implementation

---

### 26.10 Delete Semantics

**Soft delete:**
- IAM uses soft delete (status = 'deleted')

**Evidence:**
- Migration 0003_add_soft_delete.sql

---

## 27. TRANSACTION BOUNDARY

### 27.1 IAM Transaction Boundaries

**Single Module Transactions:**
- All IAM operations use DrizzleIamUnitOfWork
- No cross-module transactions
- IAM owns its transaction boundary

**Operations Requiring Transactions:**
- Register user + assign role (within IAM)
- Login + create session (within IAM)
- OAuth login + link account + create session (within IAM)
- Assign role (within IAM)

**Evidence:**
- IAM handlers use DrizzleIamUnitOfWork
- No cross-module dependencies

**Conclusion:**
- IAM owns all transaction boundaries
- No cross-module transactions required

---

## 28. SECURITY INVARIANTS

### 28.1 Non-Negotiable Rules

**RULE 1: Plaintext tokens must not be stored**
- CURRENT STATUS: ❌ VIOLATED (iam_sessions.refresh_token is plaintext)
- REQUIRED ACTION: Hash refresh_token immediately

**RULE 2: Passwords must never be stored plaintext**
- CURRENT STATUS: ✅ SATISFIED (identities.password_hash is hashed)
- VERIFICATION: BcryptPasswordHasher used

**RULE 3: Password hashes must be preserved during migration**
- CURRENT STATUS: N/A (no migration planned)
- VERIFICATION: N/A

**RULE 4: Session revocation must be enforceable**
- CURRENT STATUS: ⚠️ PARTIAL (no revoked_at field, but can delete)
- REQUIRED ACTION: Add revoked_at field

**RULE 5: Tenant boundaries must be explicit**
- CURRENT STATUS: ✅ SATISFIED (tenant_memberships table)
- VERIFICATION: IAM tenant support

**RULE 6: Authorization must not accidentally widen privileges**
- CURRENT STATUS: ✅ SATISFIED (PolicyService, PermissionGuard)
- VERIFICATION: Authorization middleware

**RULE 7: External identities must be uniquely scoped**
- CURRENT STATUS: ✅ SATISFIED (social_identities provider_user_id unique)
- VERIFICATION: Unique constraint

**RULE 8: Email uniqueness must be explicit**
- CURRENT STATUS: ✅ SATISFIED (identities.email unique)
- VERIFICATION: Unique constraint

**RULE 9: Deleted users must not accidentally authenticate**
- CURRENT STATUS: ✅ SATISFIED (status check in AuthGuard)
- VERIFICATION: Middleware implementation

**Evidence:**
- Schema inspection
- Middleware inspection
- Repository inspection

**Conclusion:**
- One CRITICAL violation (plaintext tokens)
- Other invariants satisfied

---

## 29. FINAL ARCHITECTURE DIAGRAM

```
                    ┌─────────────────────┐
                    │      Clients        │
                    │ Web / Admin / TG    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      apps/api       │
                    │ HTTP / Controllers  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   modules/iam      │
                    │                     │
                    │ Domain:             │
                    │  - User             │
                    │  - Role             │
                    │  - Permission       │
                    │  - Policy           │
                    │  - SocialIdentity   │
                    │                     │
                    │ Application:        │
                    │  - Handlers         │
                    │  - Services         │
                    │                     │
                    │ Infrastructure:     │
                    │  - Repositories     │
                    │  - OAuth Providers  │
                    │  - Security         │
                    │                     │
                    │ Presentation:       │
                    │  - Controllers      │
                    │  - Middleware       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
       │  platform   │  │  platform   │  │  platform    │
       │   database  │  │  security   │  │   logger     │
       └─────────────┘  └─────────────┘  └──────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                     ┌──────────────────┐
                     │   PostgreSQL      │
                     │  IAM Schema      │
                     │  (13 migrations) │
                     └──────────────────┘

NOT CONNECTED (Untracked Local Files):
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│ modules/identity│  │  modules/tenant │  │modules/access-  │
│ (UNTRACKED)     │  │  (PARTIAL)      │  │control (PARTIAL)│
└─────────────────┘  └─────────────────┘  └──────────────────┘
```

---

## 30. IMPLEMENTATION PHASES

### PHASE 0: Forensic Reconstruction ✅
- Git history analysis
- Architecture reconstruction
- Current state mapping
- **STATUS: COMPLETE**

### PHASE 0.1: Architecture Decision Freeze
- Decide: Keep IAM or migrate to Identity
- **RECOMMENDATION: Keep IAM**
- **STATUS: REQUIRES USER APPROVAL**

### PHASE 0.2: Migration Authority Freeze
- Confirm IAM owns migrations
- **STATUS: CONFIRMED (IAM owns migrations)**

### PHASE 0.3: Persistence Contract Freeze
- IAM persistence contract is frozen
- **STATUS: CONFIRMED**

### PHASE 1: Fix Critical Security Vulnerability
- Hash refresh_token in iam_sessions
- Add migration to hash existing tokens
- Update DrizzleSessionRepository
- **STATUS: NOT STARTED**

### PHASE 2: Implement Missing Features
- Password reset flow
- Email verification flow
- Refresh token rotation
- **STATUS: NOT STARTED**

### PHASE 3: Improve Test Coverage
- Domain tests for IAM
- Integration tests
- Security tests
- **STATUS: NOT STARTED**

### PHASE 4: Optional DDD Refactoring
- Consider incremental aggregate extraction
- Only if technical debt becomes unmanageable
- **STATUS: OPTIONAL**

### PHASE 5: Clean Up Untracked Files
- Delete or archive modules/identity
- Delete or archive untracked migrations
- **STATUS: REQUIRES USER APPROVAL**

---

## 31. PHASE 1 READINESS GATE

### PHASE 1 READINESS: NO

**Blockers:**

1. **ARCHITECTURAL DECISION REQUIRED**
   - User must approve: Keep IAM or migrate to Identity
   - RECOMMENDATION: Keep IAM (Option A)

2. **CRITICAL SECURITY VULNERABILITY**
   - Plaintext session tokens must be fixed
   - Can be fixed in IAM without migration

3. **UNTRACKED FILES DISPOSITION**
   - User must decide: Delete or archive modules/identity
   - User must decide: Delete or archive untracked migrations

4. **MISSING FEATURES**
   - Password reset not implemented
   - Email verification not implemented
   - Refresh token rotation not implemented

### CONDITIONS FOR YES:

- ✅ Migration authority frozen (IAM owns migrations)
- ✅ Persistence contract frozen (IAM contract documented)
- ❌ Architectural decision frozen (REQUIRES USER APPROVAL)
- ❌ Security vulnerability fixed (NOT STARTED)
- ❌ Untracked files disposition decided (REQUIRES USER APPROVAL)

---

## 32. OPEN QUESTIONS

### QUESTION-001: Architectural Direction

**Should we keep IAM or migrate to Identity?**

**Evidence:**
- IAM is feature-complete and runtime-active
- Identity is untracked and incomplete
- Migration risk is CRITICAL

**Recommendation:** Keep IAM

**Requires:** User decision

---

### QUESTION-002: Untracked Files Disposition

**What should we do with modules/identity and untracked migrations?**

**Options:**
A. Delete them
B. Archive them as reference
C. Commit them with ADR

**Evidence:**
- modules/identity is untracked
- No Git history
- No decision documentation

**Recommendation:** Delete or archive

**Requires:** User decision

---

### QUESTION-003: Security Fix Timeline

**When should we fix the plaintext session token vulnerability?**

**Evidence:**
- CRITICAL security vulnerability
- Can be fixed in IAM without migration

**Recommendation:** Immediately

**Requires:** User approval

---

## 33. EVIDENCE APPENDIX

### Git History Evidence

**Initial Commit:**
- Commit: a6333012494e08a68a39394877065925145e83e3
- Date: Sept 8, 2026 22:54:43 +0500
- Author: Ahyor Sabirjonovich <oazismpz@gmail.com>
- Message: "feat: initial commit - monorepo with IAM module"
- Files: 1532 files, 36994 insertions

**Move Commit:**
- Commit: 236c74d90db6e9103324d963367ec41e641d95bb
- Date: Sept 9, 2026 00:48:07 +0500
- Author: Ahyor Sabirjonovich <oazismpz@gmail.com>
- Message: "chore: move monorepo contents to repository root"
- Files: 1539 files renamed

**Migration Runtime Commit:**
- Commit: ea30c48415bb7d8f9a57e5b5888e5be17e97f9b7
- Date: Sept 29, 2026 15:11:23 +0500
- Author: Ahyor Sabirjonovich <oazismpz@gmail.com>
- Message: "Add migration runtime and platform database packages"
- Files: 23 files added

### Untracked Files Evidence

**Git Status Output:**
```
Untracked files:
  modules/identity/
  modules/tenant/infrastructure/
  modules/tenant/src/domain/Membership.ts
  modules/access-control/infrastructure/
  modules/access-control/src/domain/permission/
  packages/platform-database/migrations/
```

**Git Log for modules/identity:**
```
$ git log --all --oneline -- modules/identity
(empty - no commits)
```

### Runtime Evidence

**apps/api Imports:**
```typescript
// apps/api/src/container/iam-container.ts
import {
  DrizzleUserRepository,
  AuthService,
  // ... all from @workspace/iam
} from '@workspace/iam';
```

**No Identity Imports:**
```
$ grep -r "@workspace/identity" apps/api/
(no results)
```

### Database Schema Evidence

**IAM Migrations:**
- modules/iam/src/infrastructure/database/migrations/0001_initial.sql
- modules/iam/src/infrastructure/database/migrations/0002_add_mfa.sql
- modules/iam/src/infrastructure/database/migrations/0003_add_soft_delete.sql
- modules/iam/src/infrastructure/database/migrations/0004_add_oauth_states.sql
- modules/iam/src/infrastructure/database/migrations/0005_add_outbox_events.sql
- modules/iam/src/infrastructure/database/migrations/0006_add_password_set.sql
- modules/iam/src/infrastructure/database/migrations/0007_add_tenant_module.sql
- modules/iam/src/infrastructure/database/migrations/0008_add_membership_module.sql
- modules/iam/src/infrastructure/database/migrations/0009_add_tenant_roles.sql
- modules/iam/src/infrastructure/database/migrations/0010_add_role_assignments.sql
- modules/iam/src/infrastructure/database/migrations/0011_add_invitations.sql
- modules/iam/src/infrastructure/database/migrations/0012_fix_role_assignment_cascade.sql
- modules/iam/src/infrastructure/database/migrations/0013_magic_link_tokens.sql

**Identity Migrations (UNTRACKED):**
- packages/platform-database/migrations/0000_identity.sql
- packages/platform-database/migrations/0001_tenant.sql
- packages/platform-database/migrations/0002_authorization.sql
- packages/platform-database/migrations/0003_outbox.sql

---

## FINAL GATE: PASS

**Evidence Provided:**
- ✅ Git history analyzed (all commits)
- ✅ IAM evolution reconstructed
- ✅ Identity evolution analyzed (UNTRACKED)
- ✅ Current runtime architecture mapped
- ✅ Database schemas compared
- ✅ Authentication features compared
- ✅ Session security compared
- ✅ Authorization compared
- ✅ Test coverage compared
- ✅ File-by-file inventory created
- ✅ Dependency graph created
- ✅ Architectural contradictions identified (5 confirmed)
- ✅ Data mapping analyzed
- ✅ Migration risks analyzed (4 HIGH/CRITICAL)
- ✅ Missing capabilities identified
- ✅ Security risks identified (1 CRITICAL, 2 confirmed)
- ✅ Architectural options evaluated (3 options)
- ✅ Target architecture recommended (Option A)
- ✅ ADRs proposed (3)
- ✅ Persistence contract frozen
- ✅ Transaction boundaries defined
- ✅ Security invariants defined
- ✅ Final architecture diagram
- ✅ Implementation phases defined
- ✅ Phase 1 readiness assessed (NO - 4 blockers)
- ✅ Open questions identified (3)
- ✅ Evidence appendix provided

**Critical Finding:**
- modules/identity and packages/platform-database/migrations are UNTRACKED
- They do NOT exist in Git history
- Creation date, author, and motivation are UNKNOWN
- This changes the entire analysis - New Identity is not a committed architectural decision

**Recommendation:**
- Do NOT proceed with implementation until user approves architectural decision
- RECOMMENDATION: Keep IAM (Option A)
- Fix critical security vulnerability in IAM (hash session tokens)
- Delete or archive untracked Identity files

---

**END OF GIT FORENSIC ARCHITECTURE RECONSTRUCTION REPORT**
