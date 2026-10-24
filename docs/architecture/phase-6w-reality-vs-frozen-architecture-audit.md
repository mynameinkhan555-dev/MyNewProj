# Phase 6W — Reality vs Frozen Architecture Audit

Audit date: 2026-10-01  
Scope: static current-worktree reality audit against the frozen architecture described in the request. This report describes the files currently present, including staged, modified, and untracked work; it does **not** assert those files are in `HEAD` or deployed.

**Safety:** No source/config/migration/schema file was edited. No tests, builds, destructive harnesses, migrations, Cloud connections, or database commands were run. Only this audit document is intended to be created.

Evidence labels: **VERIFIED** = directly observed in current repository files, Git metadata, or the prior authorized Cloud audit. **INFERENCE** = reasoned risk not directly exercised. **NOT VERIFIED** = not established by available static evidence or deliberately not executed.

## 1. Executive Summary

**Architecture reality status: RED.** The worktree contains a newer Domain/port/schema direction and a legacy IAM/API runtime. Those are not yet integrated into one coherent application persistence path. The active API wires `modules/iam` Drizzle repositories/UoW, while the frozen Phase 6W reference uses `packages/platform-database` `DrizzleUnitOfWork` and `TransactionContext`. The newer Identity, Tenant, and Access Control domain contracts are substantially present, but most have no application consumers or infrastructure repository implementations.

Security-relevant forensic bypasses are present in the current worktree: inactive users are allowed to continue through login, the user-detail route omits its admin-role guard, login returns tokens in JSON despite setting HttpOnly cookies, legacy sessions store raw refresh tokens, legacy social identities have raw provider-token columns, and a JWT-secret fingerprint is logged. These findings describe current files and cannot be attributed to the committed baseline because the worktree is heavily changed.

The migration system has multiple competing mutation routes; the platform Drizzle journal has no exact SQL filename matches; the SQL-glob runner can continue after statement failures and claim success; root `db:migrate` defaults to legacy IAM migrations and baseline verification. The prior authorized Cloud audit observed 0/13 application tables and no project migration ledger; this audit did not reconnect.

**Migration authority: CONFLICT. Cloud migration gate: BLOCKED. Persistence implementation gate: BLOCKED.**

## 2. Audit Scope

Read-only inspection of repository layout, migration audit artifacts, package/config files, domain/application/infrastructure code, tests, CI/deployment files, transaction/error/outbox paths, Git status/diffs, and type escapes. Three scoped source reviews were performed for domain/application, persistence infrastructure, and security/CI/deployment. Their results were cross-checked against local source where critical.

Not performed: tests/build/typecheck, migration scripts, Drizzle commands, destructive fingerprint/fresh-reproduction harnesses, Cloud reconnect, business-row reads, or changes beyond this report.

## 3. Frozen Architecture Baseline

The requested frozen contracts are the comparison baseline: domain has no infrastructure dependency; Application uses ports and schema-agnostic `IUnitOfWork`; infrastructure owns adapters; module schemas are module-owned; one UoW/context owns a transaction; repositories do not own transaction lifecycle; UoW boundary maps database errors; business FKs use RESTRICT; RolePermission revoke is physical DELETE; aggregate/business deletes follow their explicit lifecycle; outbox intent is atomic with aggregate mutations.

The repository has documents describing some of these decisions, notably [repository-reference-pattern.md](repository-reference-pattern.md) and [persistence-engineering-quality-gate.md](persistence-engineering-quality-gate.md). The latter says its 128 checks are currently a manual standard, not CI automation. These docs are current worktree evidence, not proof of frozen/merged governance.

## 4. Git / Change-Control Baseline

**VERIFIED at audit time:** `git status --short` returned 370 status entries: 55 staged entries, 233 unstaged entries, 91 untracked entries, and 44 entries containing deletion status. Categories can overlap where a path is staged and also modified unstaged. Staged/unstaged diff stats and untracked path inventory were inspected; the worktree is not a clean baseline.

Change-control map:

| Area                         | Git state evidence                                                                                                                                                              | Assessment                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Staged work                  | 55 status entries. Includes numerous staged IAM application/domain files and a staged addition `modules/iam/src/infrastructure/database/migrations/0013_magic_link_tokens.sql`. | Current index contains uncommitted implementation/migration work.                                               |
| Unstaged work                | 233 status entries; includes broad app/API, package, config, generated-client, and test changes.                                                                                | Working tree differs materially from index.                                                                     |
| Untracked work               | 91 status entries; includes the newer Identity/Tenant/Access Control domain/schema/tests and architecture audit docs.                                                           | Source visible locally is not necessarily Git-tracked or part of a release.                                     |
| Deleted paths                | 44 status entries show deletion status, including placeholder files in module trees and older `packages/platform/src/database` files.                                           | Some structure/implementation removals are in progress; deletion intent is not inferred.                        |
| Staged migration             | IAM `0013_magic_link_tokens.sql` is staged.                                                                                                                                     | It is not in the prior recorded 0001–0012 baseline and has not been deployed/verified here.                     |
| New architecture/audit files | Several are untracked.                                                                                                                                                          | Their current contents are evidence of worktree intent only.                                                    |
| Clean baseline               | Not clean.                                                                                                                                                                      | Cannot treat current tree as `HEAD`, a release candidate, or deployment source without an approved diff review. |

No reset, clean, checkout, stage, or revert operation was performed. The new reality audit report is the only file intentionally written by this task. Since many files are untracked, Git cannot establish their pre-audit content/history; no claim is made that all pre-existing dirty entries are user-authored or committed.

## 5. Monorepo Reality

**VERIFIED:** Workspace contains separate `modules/identity`, `modules/tenant`, `modules/access-control`, and legacy `modules/iam`; packages include `kernel`, `platform`, `platform-database`, `platform-logger`, and `migration-runtime`. This is not merely the conceptual frozen layout: both newer bounded contexts and a substantial legacy IAM module coexist.

The API container imports and composes the legacy IAM context ([iam-container.ts](../apps/api/src/container/iam-container.ts#L56), [iam-container.ts](../apps/api/src/container/iam-container.ts#L178)). Root migration command also targets legacy IAM by default ([migrate.ts](../scripts/src/migrate.ts#L16)). The newer module schemas are separately composed by Drizzle Kit config ([drizzle.config.ts](../packages/platform-database/drizzle.config.ts#L4)). **Drift classification: D — legacy artifact / E — authority decision required.**

## 6. Domain Reality

| Frozen area                         | Current source reality                                                                                                                                                                                                                                                                                               | Classification                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Identity aggregates                 | `User`, `EmailIdentity`, `ExternalIdentity`, `PasswordCredential`, and `Session` domain classes exist under `modules/identity/src/domain`. User explicitly excludes credentials, sessions, external identity, and tenant membership from the User aggregate ([User.ts](../modules/identity/src/domain/User.ts#L16)). | **VERIFIED**, currently untracked in Git inventory.              |
| Tenant/Membership                   | `Tenant` and `Membership` aggregates exist; Membership holds typed User/Tenant IDs and separate lifecycle ([Membership.ts](../modules/tenant/src/domain/Membership.ts#L30)).                                                                                                                                         | **VERIFIED**, current worktree.                                  |
| Access Control                      | `Permission`, `TenantRole`, `RoleAssignment`, and `RolePermission` model files exist. RolePermission is explicitly a relationship model, not an AggregateRoot ([RolePermission.ts](../modules/access-control/src/domain/role-permission/RolePermission.ts#L35)).                                                     | **VERIFIED**, current worktree.                                  |
| Legacy IAM domain                   | Older Identity/IAM aggregates and contracts remain under `modules/iam`; the active API composes these.                                                                                                                                                                                                               | **VERIFIED**.                                                    |
| Application consumers for new ports | No current Identity/Tenant/Access Control application consumers were found in those newer modules; their application directories are placeholders/empty.                                                                                                                                                             | **VERIFIED search result**, external consumers **NOT VERIFIED**. |
| Lifecycle/physical delete           | Newer domain aggregates use `DELETED` transitions. Several child/relationship ports expose physical-delete-shaped operations; implementations are absent, so runtime behavior is **NOT VERIFIED**.                                                                                                                   | Mixed contracts; decisions remain aggregate-specific.            |

No evidence supports collapsing User/credential/session/membership into one aggregate. Conversely, no completed new-module use cases demonstrate the proposed persistence ports end-to-end.

## 7. Application Reality

The newer `identity`, `tenant`, and `access-control` modules contain domain contracts but no implemented application workflow consuming `IPasswordCredentialRepository` or the other new persistence ports. Do not create synthetic use cases merely to justify repository implementations.

The legacy IAM module has application command/query handlers and is what the API composes. Examples include registration and login. Some current worktree handler behavior violates frozen policy (section 16), so application architecture is not uniformly in the newer contract state.

## 8. Infrastructure Reality

The newer Identity module has a `DrizzleUserRepository`, `UserMapper`, table schema, and a User PostgreSQL integration test, but these files are untracked in the inspected Git status. The newer Tenant and Access Control Drizzle schema declarations exist, while their repository/mappers are not implemented. `PasswordCredentialRepository` and mapper are absent.

The active API instead builds a Drizzle client over legacy IAM tables, seeds default RBAC, constructs legacy repositories and `DrizzleIamUnitOfWork` ([iam-container.ts](../apps/api/src/container/iam-container.ts#L178), [iam-container.ts](../apps/api/src/container/iam-container.ts#L195)). It sets `events` to `InMemoryIamEventBus` and `outboxDispatcher` to `null` ([iam-container.ts](../apps/api/src/container/iam-container.ts#L201), [iam-container.ts](../apps/api/src/container/iam-container.ts#L358)).

**Drift:** intended new platform persistence is not the active API persistence path. Classification: **B — implementation incomplete**, **D — legacy artifact**, and authority question **E — unknown**.

## 9. Repository Reality

The frozen repository reference is `DrizzleUserRepository`: constructor-injected `TransactionContext`, no repository transaction creation, mapper-based translation, UoW-owned SQLSTATE mapping, and `.returning()`-based User not-found handling ([user.repository.ts](../modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.ts#L32), [user.repository.ts](../modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.ts#L79)). This is a current untracked implementation, with an integration suite but no run in this audit.

The active API's legacy IAM repositories instead accept Drizzle DB objects directly (`NodePgDatabase<any>`) and are exposed from the IAM module barrel. `DrizzleIamUnitOfWork` creates repositories from its transaction callback ([DrizzleIamUnitOfWork.ts](../modules/iam/src/infrastructure/database/DrizzleIamUnitOfWork.ts#L14), [DrizzleIamUnitOfWork.ts](../modules/iam/src/infrastructure/database/DrizzleIamUnitOfWork.ts#L18)). No repository implementation was found for the newer PasswordCredential port.

**Repository gate: BLOCKED.**

## 10. Mapper Reality

A newer `UserMapper` exists and reconstructs a User, but casts persisted status to `UserStatus` without runtime validation and the repository casts a result row to `UserSelect` ([user.mapper.ts](../modules/identity/infrastructure/persistence/drizzle/mappers/user.mapper.ts#L51), [user.repository.ts](../modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.ts#L54)). Legacy IAM `UserMapper` has a similar status cast ([UserMapper.ts](../modules/iam/src/infrastructure/mappers/UserMapper.ts#L29)).

No newer mappers for PasswordCredential, Tenant/Membership, Permission/TenantRole/RoleAssignment/RolePermission were found. Domain reconstruction path exists for PasswordCredential, but persistence reconstruction is not implemented. Mapper architecture is **PARTIALLY IMPLEMENTED**.

## 11. UnitOfWork / Transaction Reality

| Contract                             | Current reality                                                                                                                                 | Status                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application port only `execute<T>()` | `packages/platform/src/ports/IUnitOfWork.ts` exposes execute only.                                                                              | **PASS in source**                                                                                                                                                                                                                                                                                                 |
| Frozen platform UoW                  | `DrizzleUnitOfWork` activates/clears TransactionContext around `db.transaction`, one execution per instance, and maps class-23 SQLSTATE errors. | **VERIFIED implementation** ([DrizzleUnitOfWork.ts](../packages/platform-database/src/unitOfWork/DrizzleUnitOfWork.ts#L119))                                                                                                                                                                                       |
| Active API UoW                       | API composes `DrizzleIamUnitOfWork`, whose separate port is `run(work)` and directly creates legacy repositories from transaction DB.           | **Architecture divergence** ([DrizzleIamUnitOfWork.ts](../modules/iam/src/infrastructure/database/DrizzleIamUnitOfWork.ts#L16))                                                                                                                                                                                    |
| Repository transaction ownership     | New reference adapter does not own transactions; legacy adapters receive a transaction-scoped DB from IAM UoW.                                  | Different implementations; active runtime is legacy path.                                                                                                                                                                                                                                                          |
| Type safety                          | `TransactionContext`, `DrizzleUnitOfWork`, `createDatabaseClient`, and legacy IAM DB boundaries use `any`/`NodePgDatabase<any>`/casts.          | **Violates literal zero-any gate** ([TransactionContext.ts](../packages/platform-database/src/unitOfWork/TransactionContext.ts#L31), [DrizzleUnitOfWork.ts](../packages/platform-database/src/unitOfWork/DrizzleUnitOfWork.ts#L38), [drizzle-client.ts](../packages/platform-database/src/drizzle-client.ts#L30)). |
| Runtime verification                 | No tests/build/database transaction tests run in this audit.                                                                                    | **NOT VERIFIED**                                                                                                                                                                                                                                                                                                   |

The newer UoW maps `23505`, `23503`, `23502`, `23514`; unknown integrity class 23 maps to base `PersistenceError`; non-23 errors are rethrown. The active IAM UoW has no equivalent mapping. A legacy application registration handler inspects raw code/message `23505` itself ([RegisterUserHandler.ts](../modules/iam/src/application/commands/register-user/RegisterUserHandler.ts#L106)). This contradicts the frozen centralized UoW boundary on the active path.

## 12. Database / Drizzle Reality

Platform Drizzle config composes platform outbox + Identity + Tenant + Access Control schema barrels. Module schema ownership is retained in source, but cross-module schema imports exist: Tenant schema imports Identity infrastructure schema; Access Control imports Tenant infrastructure schema. `platform-database` config points at these module schemas for generation; whether this violates the “platform package must not import business modules” rule depends on whether this is considered generator composition configuration or a runtime import. It is a **concrete coupling requiring decision**, not a domain/application dependency leak.

The legacy API runtime schema differs materially: text-ID `identities`, `iam_sessions` with raw refresh token, `social_identities` with provider access/refresh token columns, and legacy IAM tables. The new platform schema uses UUID `users`, hashed refresh token, and separate identity aggregates. The prior Cloud audit found 0/13 platform tables; Cloud is not checked in this audit.

Local schema-vs-SQL drift is detailed in the prior [migration authority audit](phase-6w-step-3-migration-authority-audit.md#L132). Key examples: migration-only `users.status` CHECK, `password_credentials.user_id` UNIQUE, external identity uniqueness, active membership/assignment partial unique indexes; schema-only snapshot drift for permissions/tenant role constraints; missing DSL composite PK/FK for event consumption and RolePermission. No local schema or migration was changed.

## 13. Migration Authority Reality

The prior [migration authority audit](phase-6w-step-3-migration-authority-audit.md) and [Cloud audit](phase-6w-step-3-cloud-postgresql-audit.md) remain consistent with current package/scripts inspected for this report:

- Root `pnpm db:migrate` → `@workspace/scripts migrate` → `scripts/src/migrate.ts` → custom `MigrationRunner` → legacy IAM migration directory by default.
- Platform `drizzle-kit generate/migrate/push` → `packages/platform-database/drizzle.config.ts` → platform/module schemas and `packages/platform-database/migrations`.
- Platform `db:apply-migrations` → SQL-glob runner; ignores journal/history, catches SQL errors and continues.
- CI does not run a migration command. It references a missing `scripts/ci-migration-guardrail.ts` and runs baseline fingerprint validation in a local Postgres CI job.
- Deployment command invoking any migration route was not found in inspected deployment files. External release pipeline is **NOT VERIFIED**.

**Migration authority: CONFLICT, not resolved.**

## 14. Migration Chain Integrity

Platform Drizzle journal entries 0–4 all lack exact `${tag}.sql` files; four actual platform SQL files have no exact journal entry. Snapshot `prevId` chain is continuous, but 0004 snapshot contains 13 tables while outbox SQL is numbered 0003; 0003 snapshot contains 11 tables. Legacy IAM 0001–0013 is a separate, lexically ordered chain; 0002/0003 are empty. Its baseline/fingerprint identity is 0012; 0013 is staged and outside that baseline.

Static clean-db result for the platform chain is **RED**: Drizzle migrator cannot load its first journal tag; SQL-glob runner suppresses errors and cannot establish successful state. Root default with empty ledger enters baseline comparison and does not apply migration SQL. No clean DB rebuild test was executed.

## 15. Outbox / Event Infrastructure

New platform outbox migration/schema exists. The API container’s event bus is `InMemoryIamEventBus`; it sets `outboxDispatcher: null` ([iam-container.ts](../apps/api/src/container/iam-container.ts#L201), [iam-container.ts](../apps/api/src/container/iam-container.ts#L358)). Registration enqueues outbox intent inside the UoW, but no configured dispatcher drains it. Platform outbox dispatcher/lease machinery exists in another package path but tests use fakes; DB claim concurrency and `SKIP LOCKED` runtime are **NOT VERIFIED**. No consumer deduplication runtime was found in the active API composition.

**Risk:** events may be transactionally enqueued but never delivered by the configured API. This is a current worktree composition fact; deployment/worker composition elsewhere is **NOT VERIFIED**.

## 16. Security Audit

Findings below are from current worktree files and may be uncommitted forensic changes; they are not attributed to `HEAD`.

| Severity     | Finding                                                                                                                                               | Evidence / classification                                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH         | Login logs inactive-account status but does not reject; rejection is commented out and token generation continues.                                    | **VERIFIED current file** [LoginUserHandler.ts](../modules/iam/src/application/commands/login-user/LoginUserHandler.ts#L82). Impact on production deployment **INFERENCE** until this tree is confirmed as deployed.                                                    |
| HIGH         | User detail `/:id` route uses authentication but its admin role requirement is commented out; no tenant authorization check is visible before lookup. | **VERIFIED current file** [UserController.ts](../modules/iam/src/presentation/http/controllers/UserController.ts#L44). Cross-tenant disclosure impact is an **INFERENCE** depending on route deployment/ID access.                                                      |
| HIGH         | Login sets HttpOnly cookies and also returns the full token-bearing result in JSON.                                                                   | **VERIFIED current file** [AuthController.ts](../modules/iam/src/presentation/http/controllers/AuthController.ts#L130). Exposure to browser scripts depends on frontend usage, but response body includes tokens.                                                       |
| HIGH         | Legacy `iam_sessions.refresh_token`, `social_identities.access_token`, and `refresh_token` are raw-token-shaped columns.                              | **VERIFIED schema** [sessions.table.ts](../modules/iam/src/infrastructure/database/schema/sessions.table.ts#L14), [social_identities.table.ts](../modules/iam/src/infrastructure/database/schema/social_identities.table.ts#L15). Whether deployed is **NOT VERIFIED**. |
| MEDIUM       | JWT service logs an unsalted SHA-256 fingerprint of `JWT_SECRET` at initialization/sign/verify.                                                       | **VERIFIED current file** [JsonWebTokenService.ts](../packages/platform/src/security/jwt/JsonWebTokenService.ts#L46). No secret value printed. Offline guessing risk is an **INFERENCE**.                                                                               |
| MEDIUM       | Default API bootstrap does not pass a cache to the magic-link limiter; limiter allows when cache absent.                                              | **VERIFIED current wiring** [bootstrap.ts](../apps/api/src/bootstrap.ts#L14), [RateLimiter.ts](../modules/iam/src/application/security/RateLimiter.ts#L20). Request abuse risk is an **INFERENCE**.                                                                     |
| MEDIUM       | A cross-tenant detail route and a role-assignment handler field mismatch are present in current IAM controller paths.                                 | `req.user.id` is read while AuthGuard sets `userId`; see [UserController.ts](../modules/iam/src/presentation/http/controllers/UserController.ts#L75), [AuthGuard.ts](../modules/iam/src/presentation/http/middleware/AuthGuard.ts#L57). Runtime behavior not tested.    |
| LOW/MEDIUM   | Migration fingerprint validator/test harness contains DROP/CREATE DATABASE against a URL-derived admin connection.                                    | **VERIFIED code**, never executed here ([validate-baseline-fingerprint.ts](../scripts/validate-baseline-fingerprint.ts#L169), [test-fresh-reproduction.ts](../scripts/test-fresh-reproduction.ts#L76)). Unsafe if pointed at non-disposable DB.                         |
| NOT VERIFIED | Live secrets, `.env` values, deployed token/session data, deployed route wiring, Supabase project intent.                                             | No secret values read/reproduced in this audit; no Cloud reconnect.                                                                                                                                                                                                     |

No confirmed live credential literal was reproduced. `.env` was not read in this audit. Prior reports note duplicate `DATABASE_URL` assignments and URL-derived project reference, but dashboard target identity is not confirmed.

## 17. Test Architecture

Present in current worktree:

- Domain unit tests for Identity, Tenant, Access Control, and legacy IAM.
- Newer Identity UserRepository PostgreSQL integration test, including duplicate UUID, update, commit/rollback, inactive context, and isolation cases; file is untracked and was not run.
- Platform UoW tests; persistence mapping unit test uses a fabricated error/mock transaction.
- Outbox tests use `FakeStore`/`FakeTransport`, not PostgreSQL.
- Legacy IAM magic-link application tests cover concurrency/expiration/replay/failure with in-memory fakes; they do not prove PostgreSQL concurrency.
- CI config runs root unit tests and refers to baseline validator; CI test job does not configure the PostgreSQL service environment shown in the separate code-quality job.

Not executed in this audit: all tests/build/lint/typecheck, PostgreSQL integration, clean DB rebuild, migration runners. Test status is **NOT VERIFIED**. Destructive fingerprint/fresh-reproduction harnesses were inspected but not executed.

## 18. CI/CD Audit

- `.github/workflows/ci.yml` has security scan, lint, format, typecheck, migration-guardrail reference, baseline fingerprint validator, root unit test, and coverage steps.
- `scripts/ci-migration-guardrail.ts` is referenced but absent in the current workspace.
- CI has a PostgreSQL 17 service and local URL in code-quality job; no migration execution command is configured there.
- Snyk action is `@master` and `continue-on-error: true`; mutable action pin/nonblocking scan are **VERIFIED config risks**.
- No inspected deployment workflow invokes root migrate, Drizzle migrate, push, or SQL-glob runner. Actual release pipeline outside repository is **NOT VERIFIED**.
- Docker Compose publishes Postgres/Redis/observability ports; exposure depends on host controls. Some observability images use `latest`. Production Kubernetes API manifest references secrets and runs non-root/read-only root filesystem; cluster policies and actual secret content **NOT VERIFIED**.

## 19. Dependency Direction Audit

| Frozen direction                                   | Current evidence                                                                                                                                      | Assessment                                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain → no infrastructure/database                | Targeted domain imports in new modules did not show infra/Drizzle imports; legacy production domain/application scan likewise found no infra imports. | No violation found in sampled production paths; full automated boundary enforcement absent.                                                     |
| Application → ports, not concrete DB               | New ports are domain-level; legacy IAM application UoW port is separate. Registration handler contains raw SQLSTATE/message matching.                 | Active legacy error-boundary violation.                                                                                                         |
| Infrastructure → domain/ports/platform             | New schemas import cross-module infrastructure schemas (Tenant→Identity; Access Control→Tenant).                                                      | Concrete infrastructure coupling; frozen module schema ownership/composition rule needs clarification.                                          |
| platform-database → no business modules at runtime | Package source client/schema does not import business schema; Drizzle Kit config references module schema paths.                                      | Runtime boundary appears preserved; generator config couples DB package to modules. Distinguish config tooling from runtime package dependency. |
| Infrastructure → no presentation                   | No concrete violating production import identified in sampled paths.                                                                                  | NOT VERIFIED repository-wide.                                                                                                                   |
| Dependency tooling                                 | `scripts/check-deps.ts` and `scripts/validate-imports.ts` are empty; no boundary gate in inspected CI.                                                | Architecture enforcement NOT VERIFIED / absent in those files.                                                                                  |

## 20. Concurrency / Invariant Audit

- Intended migration SQL has PostgreSQL uniqueness for email, external provider/subject, credential per user, permission key, tenant-role key, active membership pair, and active role assignment pair. Several are migration-only vs Drizzle DSL, so generator/source-of-truth drift remains.
- RolePermission composite PK exists in SQL but not its Drizzle table declaration; concurrent duplicate grants are DB-protected only if the SQL migration has actually been applied. Cloud state from prior audit is 0/13 tables.
- Domain/application prechecks alone cannot guarantee concurrent one-primary-email, one-active-membership, or one-active-assignment invariants. DB constraints are required; deployed presence is **NOT VERIFIED**.
- Platform custom migration runner advisory lock applies only to that runner. Drizzle migration and SQL-glob routes bypass it; competing executors can race.
- Active legacy outbox uses different table model; no configured dispatcher and no proven PostgreSQL claim/lease locking in active composition.
- No DB concurrency test was run. Race safety in Cloud is **NOT VERIFIED**.

## 21. Fresh Database Reproducibility

**RED** for the intended 13-table platform chain: Drizzle tags cannot locate SQL; the SQL-glob runner is not fail-closed/history-aware; root migration command defaults to the distinct IAM lineage and fingerprint baseline adoption rather than clean bootstrap.

The legacy IAM 0001–0012 chain has static CI/fresh-reproduction harness source but no execution result was collected here. Those harnesses can DROP/CREATE fixed DB names and must only run in isolated test PostgreSQL. Legacy chain does not rebuild the newer 13-table schema. No clean DB reconstruction is established by this audit.

## 22. Architecture Drift Classification

| Drift                                                                        | Classification                                                 | Evidence / risk                                                                 |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Legacy IAM runtime coexists with newer bounded contexts                      | D — legacy artifact / E — authority unresolved                 | API root composition uses legacy IAM while Drizzle config composes new modules. |
| New module ports/schemas exist without application/repository implementation | B — incomplete implementation                                  | Domain tests exist; consumers/adapters mostly absent.                           |
| API uses different UoW/error boundary from frozen platform UoW               | C — architecture regression on active path                     | API wires `DrizzleIamUnitOfWork`; raw SQLSTATE mapping in handler.              |
| Schema/SQL/snapshot drift                                                    | B/C — incomplete source representation; history origin unknown | Constraints differ across DSL, SQL, snapshots.                                  |
| Forensic bypasses in login/user route/token response                         | C — security regression if active/deployed                     | Current source comments identify temporary bypass; deployment status unknown.   |
| Duplicate `.env` URL / dirty Git baseline                                    | E — requires change-control decision                           | Prior safe checks report duplicate key; values intentionally not repeated.      |
| Unconfigured outbox dispatcher                                               | B — runtime incomplete                                         | Container returns dispatcher null and in-memory event bus.                      |
| `any` boundaries conflict with zero-any gate                                 | C — quality-contract contradiction                             | TransactionContext/UoW/client/API types use `any`; gate is manual.              |

## 23. Decision Register

| ID     | Question                                                    | Evidence                                                                                   | Options / trade-offs                                                                                                                                                               | Candidate (not final)                                              | Risk / prerequisites                                                                      |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| DEC-01 | Which migration authority owns production?                  | Root IAM runner, platform Drizzle migrate, SQL-glob runner, db:push all exist.             | One authority reduces ledger/locking ambiguity; choosing Drizzle requires journal/history reconciliation; choosing root requires deciding whether legacy schema remains canonical. | Architecture owner selects one, disables/guards the rest.          | **REQUIRES HUMAN ARCHITECTURE DECISION**; first Cloud apply blocked.                      |
| DEC-02 | Which schema lineage is the target?                         | Legacy text-ID `identities`/IAM vs UUID 13-table schema conflict on names/types/lifecycle. | Retain legacy, replace/transition, or explicitly isolate schemas.                                                                                                                  | Confirm product/deployment intent before DDL.                      | **REQUIRES HUMAN ARCHITECTURE DECISION**; mixed apply risks incompatible existing tables. |
| DEC-03 | How reconcile journal/SQL/snapshot history?                 | Five tags missing SQL; four unjournaled SQL; idx4 snapshot has outbox.                     | Recover provenance, create forward-only bridge, or designate new bootstrap baseline.                                                                                               | Preserve applied history; choose after DB inventory/owner signoff. | **REQUIRES HUMAN ARCHITECTURE DECISION**; other DB histories unknown.                     |
| DEC-04 | Should CI guardrail be restored or reference removed?       | Workflow references absent file.                                                           | Restore verified intended script vs remove stale gate.                                                                                                                             | Determine expected checks from history/owners.                     | **REQUIRES HUMAN ARCHITECTURE DECISION**.                                                 |
| DEC-05 | What is the API’s canonical UoW/outbox wiring?              | Legacy UoW active; frozen platform UoW not wired; dispatcher null.                         | Migrate composition to new modules vs freeze legacy application architecture.                                                                                                      | Decide after domain/application transition plan.                   | Atomic event delivery/security behavior at risk.                                          |
| DEC-06 | How meet zero-any without Drizzle leaking into Application? | Frozen TransactionContext/UoW/client boundaries use `any`; IUnitOfWork itself is typed.    | Generic infrastructure transaction boundary or scoped exception.                                                                                                                   | Type infra boundary while preserving port.                         | **REQUIRES HUMAN ARCHITECTURE DECISION**.                                                 |
| DEC-07 | Which forensic bypasses are intended to ship?               | Inactive-user bypass, role-guard bypass, token body response, raw token columns.           | Revert/close bypasses vs confirm controlled local-only forensic branch.                                                                                                            | Treat as release blocker until owner confirms.                     | Security exposure if deployed.                                                            |
| DEC-08 | Is current `.env` target correct and deterministic?         | Prior audit reports duplicate DATABASE_URL and URL-derived ref not dashboard-confirmed.    | Confirm project, remove duplicate assignment, keep secrets out of audit.                                                                                                           | Owner confirms target before changes.                              | Wrong-database mutation risk.                                                             |

All listed decisions remain **REQUIRES HUMAN ARCHITECTURE DECISION** where not already frozen. No choice was finalized here.

## 24. Implementation Roadmap

No implementation performed. Suggested gated sequence:

| Phase                             | Prerequisites                                                             | Changes (future, not authorized here)                                                                 | Required tests/evidence                                                        | Rollback / exit criteria                                                     |
| --------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| A. Baseline preservation          | Owner accepts current Git dirty/untracked inventory.                      | Capture reviewed patch/change manifest; decide what belongs in release.                               | `git status`, staged/unstaged diffs, file provenance.                          | Stop if staged/untracked provenance is unclear; exit with approved baseline. |
| B. Migration authority freeze     | DEC-01/02; target DB confirmed.                                           | Select one runner, directory, ledger, lock, transaction/error semantics.                              | Static architecture gate + runner unit tests.                                  | No DB changes; exit with signed migration contract.                          |
| C. Migration reconciliation       | Authority frozen; supported DB states inventoried safely.                 | Preserve applied history; resolve journal/file/snapshot/DSL divergence via approved forward strategy. | Clean DB + upgrade/shadow rehearsal, failure injection, checksum validation.   | Forward-only recovery plan; exit only reproducible chain.                    |
| D. Persistence boundary alignment | New application contracts approved; type boundary decision.               | Wire one UoW, context, repositories, mappers; remove duplicate runtime paths only by approved change. | Typecheck, architecture tests, DB integration.                                 | Preserve old runtime until migration plan accepted.                          |
| E. Security/outbox closure        | Security findings triaged; event consumers defined.                       | Close forensic bypasses, hash/secret handling, dispatcher wiring.                                     | Authz tests, token redaction, PostgreSQL rollback/lease/concurrency tests.     | Feature flags/rollback without raw-token exposure.                           |
| F. CI/release gates               | Runner frozen and scripts recoverable.                                    | Fail-closed migration integrity, isolated DB tests, approval gate; pin actions/permissions.           | CI matrix and disposable PostgreSQL rebuild/upgrade evidence.                  | Release blocked on any missing gate.                                         |
| G. Cloud bootstrap                | Cloud target confirmed, backup/PITR/restore verified, clean chain tested. | Approved migration execution only through frozen authority.                                           | Pre/post catalog snapshots, ledger/hashes, 13-table schema verification.       | Stop/rollback using documented recovery; no ad hoc SQL.                      |
| H. Repository qualification       | Cloud schema verified; contract frozen.                                   | Implement PasswordCredentialRepository and subsequent adapters.                                       | Real PostgreSQL tests for constraints, transactions, error boundary, security. | Do not mark qualified until evidence matrix passes.                          |

## 25. Quality Gates

The current manual [Persistence Engineering Quality Gate](persistence-engineering-quality-gate.md) declares 128 rules but no CI automation. Relevant IDs: `ARC-01`–`ARC-12` dependency/ownership; `TYP-01`–`TYP-03` any/casts/narrowing; `DB-01`–`DB-20` schema/migration integrity; `SEC-01`–`SEC-12`; `TX-01`–`TX-10`; `ERR-01`–`ERR-10`; `TEST-01`–`TEST-20`; `REL-01`–`REL-10`; `CRED-01`–`CRED-10`.

Current reportable gate states: DB/schema/migration checks fail or not run; unit/type/lint/build checks **NOT RUN** here; Cloud checks inherit prior authorized read-only evidence only; active security bypasses require release review; migration authority and target identity are **BLOCKED**.

## 26. Final Status

```text
ARCHITECTURE REALITY STATUS: RED
MIGRATION AUTHORITY: CONFLICT
CLOUD MIGRATION GATE: BLOCKED
PERSISTENCE IMPLEMENTATION GATE: BLOCKED

REASON:
The API runtime, frozen platform persistence architecture, legacy IAM
migration chain, and platform Drizzle migration chain are not one coherent
verified deployment path. Security bypasses are present in current-worktree
files, Git baseline is heavily dirty, and Cloud has 0/13 expected tables
per prior read-only audit. Migration authority and target lineage require
human architecture decisions before execution or repository implementation.
```

## 27. Evidence

Primary evidence paths inspected:

- Git/change control: `git status --short`, `git diff --stat`, `git diff --cached --stat`, `git ls-files --others --exclude-standard`.
- API active wiring: `apps/api/src/container/iam-container.ts`, `apps/api/src/bootstrap.ts`.
- Security paths: `modules/iam/src/application/commands/login-user/LoginUserHandler.ts`, `modules/iam/src/presentation/http/controllers/UserController.ts`, `modules/iam/src/presentation/http/controllers/AuthController.ts`, legacy identity/session/social schemas, `packages/platform/src/security/jwt/JsonWebTokenService.ts`.
- New bounded contexts: `modules/identity`, `modules/tenant`, `modules/access-control` domain/ports/schema/tests and untracked repository/mapper files.
- Persistence runtime: `packages/platform-database/src/unitOfWork`, `modules/iam/src/infrastructure/database/DrizzleIamUnitOfWork.ts`, `packages/platform/src/ports/IUnitOfWork.ts`.
- Migration/config: root/package scripts, `scripts/src/migrate.ts`, `packages/migration-runtime`, both SQL migration directories, platform journal/snapshots, Drizzle config and installed Kit/ORM implementations, CI/deployment files.
- Prior audit evidence: [migration authority audit](phase-6w-step-3-migration-authority-audit.md), [Cloud PostgreSQL audit](phase-6w-step-3-cloud-postgresql-audit.md), and [repository reference pattern](repository-reference-pattern.md).

Tooling/actions: file search/read, three read-only source review agents, Git status/stat/name inventories, and PowerShell static pattern extraction. No tests/build/lint/typecheck, migration scripts, database queries, Cloud connection, or destructive harness ran. Exact final report creation is documented in section 28.

## 28. Source-only IAM Responsibility Reconnaissance

This addendum compares the task-provided Identity-Centric target with executable source. It does not use prior reports as evidence for current IAM behavior. “Implemented” means source has a behavior; “reachable” means the inspected API composition mounts/wires it; neither term implies tests passed or production deployment.

| Responsibility                | Identity-Centric target responsibility                                                        | Current legacy IAM responsibility in code                                                                                                                                                                                                  | Current newer module code / runtime reachability                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Authentication / registration | Authenticate an account; User is not a container for unrelated tenant/authorization concerns. | `User` contains email, password hash, `passwordSet`, roles, status, and sessions; register/login handlers use this aggregate.                                                                                                              | New Identity `User` exists and separates other aggregates; no API import/use-case reachability found.           |
| Email identity / verification | EmailIdentity distinct from password credential; canonical/verified state explicit.           | Legacy `identities.email` is globally unique on the same row as `password_hash`; registration creates `unverified` status. `email_verification` is a magic-link purpose, but verify handler does not mutate email/status for that purpose. | New EmailIdentity aggregate/table/port exists; no application use case/repository adapter is wired.             |
| External identity / linking   | Provider subject/metadata, no OAuth secrets.                                                  | Legacy `SocialIdentity` is a separate class/table but includes access/refresh token fields. OAuth login can auto-link an existing User found by verified matching email. Explicit link route/handler also exists.                          | New ExternalIdentity aggregate/table/port separates provider metadata; not runtime-wired.                       |
| Password credential           | Separate User-owned credential containing only an already-hashed password.                    | `User` owns `PasswordHash`; legacy `identities.password_hash` and `password_set` store credential state on User row.                                                                                                                       | New PasswordCredential aggregate/port/table exists; no mapper/repository/application consumer/API reachability. |
| Session/token                 | User-owned; refreshTokenHash; revokedAt; no tenantId; expiry/revocation enforced.             | Separate Session/table but raw `refresh_token`; no persisted revoked field; device/IP/user-agent; cascade FK.                                                                                                                              | New Session aggregate/table/port uses refreshTokenHash/revokedAt and omits tenantId; no repository/API wiring.  |
| Tenant/Membership             | Independent Tenant; Membership is an independent User↔Tenant relation.                        | Legacy Tenant has owner/tier/slug/deletedAt; memberships are separate but use text IDs and tenantId has no FK in the inspected Drizzle table.                                                                                              | New Tenant/Membership aggregates/ports/schema exist; no active API integration.                                 |
| Authorization                 | Membership→RoleAssignment→TenantRole→RolePermission→TenantPermission.                         | Legacy roles/permissions/policies and joins exist; User loads roles. Separate tenant role/assignment tables exist, with legacy cascade behavior.                                                                                           | New Access Control aggregates/ports/schema exist; no application handlers/adapters/API reachability.            |
| MFA                           | Enrollment, factor/secret storage, verification and recovery workflows.                       | Event/assurance enum names and empty historical migration files exist; no MFA factor repository, handler, TOTP flow or HTTP route found.                                                                                                   | No integrated MFA runtime found in newer modules.                                                               |
| Magic Link                    | Digest only, purpose bound, atomic one-time consume and actual delivery.                      | Digest token, partial unique migration, API request/verify flows exist; delivery subscriber is not wired; verify has no shared UoW.                                                                                                        | No equivalent new Identity runtime found.                                                                       |
| Account linking               | Explicit authenticated linking, ownership checks and unlink lifecycle.                        | Explicit POST link checks subject collision; OAuth login also auto-links matching verified email; no unlink route implemented in inspected controller.                                                                                     | No new-module linking flow found.                                                                               |

**Responsibility finding:** Legacy `User` is not equivalent to the target User+Credential+ExternalIdentity+Authorization split: it stores email/password/passwordSet and carries roles/sessions state. Legacy SocialIdentity is separate in type/table but has token fields. Legacy Session is separate but stores raw refresh token and device metadata. Tenant/Membership are separate classes/tables but differ in identifiers, FK/lifecycle behavior. New modules model the intended separations in source but have not replaced the active IAM runtime.

## 29. Runtime Flows — HTTP to Persistence and Response

### API Entry and Route Mounts

```text
apps/api/src/main.ts → bootstrap() → createContainer()
 → createServer() → app.use('/api', createRoutes())
 → router.use('/v1', v1)
 → v1.use('/', iamRouter)
 → v1.use('/identity', iamRouter)  // same router alias
```

Evidence: [bootstrap.ts](../apps/api/src/bootstrap.ts#L12), [server.ts](../apps/api/src/server.ts#L8), [routes.ts](../apps/api/src/routes.ts#L34), [routes.ts](../apps/api/src/routes.ts#L39). Legacy IAM router mounts `/auth`, `/users`, `/roles`, `/permissions`, `/auth/oauth`, and `/policies` ([presentation/index.ts](../modules/iam/src/presentation/index.ts#L57)). These are statically mounted paths; requests were not exercised.

### Register

```text
POST /api/v1/auth/register (also /api/v1/identity/auth/register)
 → validate request → RegisterUserHandler
 → Email.create → password strength validation → hash plaintext input
 → User.create(email, PasswordHash, status=Unverified)
 → IAM UoW.run → roles.findByName('user')
 → users.save + users.assignRole
 → pull events → outbox.enqueueAll (or in-memory event list)
 → return userId/email/displayName
```

Evidence: [AuthController.ts](../modules/iam/src/presentation/http/controllers/AuthController.ts#L102), [RegisterUserHandler.ts](../modules/iam/src/application/commands/register-user/RegisterUserHandler.ts#L28), [RegisterUserHandler.ts](../modules/iam/src/application/commands/register-user/RegisterUserHandler.ts#L64), [RegisterUserHandler.ts](../modules/iam/src/application/commands/register-user/RegisterUserHandler.ts#L89), [DrizzleUserRepository.ts](../modules/iam/src/infrastructure/repositories/DrizzleUserRepository.ts#L84). Email/password/status reside on the same legacy User/identities row. The handler catches raw 23505/message text. It may return `Result.err` inside a transaction callback; **INFERENCE:** if earlier DB writes succeeded and the callback resolves, they may commit. No transaction test was run.

### Login

```text
POST /api/v1/auth/login
 → validate → find User by email → compare password hash
 → inactive status logs but rejection is commented out
 → issue access token from userId/roles
 → issue refresh token from userId/sessionId
 → create/save Session with raw refresh token + device/IP/user-agent
 → add session event to outbox or in-memory event list
 → return tokens + user data
 → controller sets HttpOnly cookies AND serializes token-bearing result as JSON
```

Evidence: [LoginUserHandler.ts](../modules/iam/src/application/commands/login-user/LoginUserHandler.ts#L63), [LoginUserHandler.ts](../modules/iam/src/application/commands/login-user/LoginUserHandler.ts#L82), [LoginUserHandler.ts](../modules/iam/src/application/commands/login-user/LoginUserHandler.ts#L94), [AuthController.ts](../modules/iam/src/presentation/http/controllers/AuthController.ts#L104), [sessions.table.ts](../modules/iam/src/infrastructure/database/schema/sessions.table.ts#L5). The inactive-account rejection is not executed in current source. Legacy Session persistence stores the token value, not a digest.

### Refresh, Logout, Change Password

- Refresh reads cookie → verifies JWT → loads Session → checks expiry/user/stored raw token → loads active User → issues new access/refresh tokens → conditional database rotation matching old token → updates cookies ([AuthService.ts](../modules/iam/src/application/services/AuthService.ts#L37), [DrizzleSessionRepository.ts](../modules/iam/src/infrastructure/repositories/DrizzleSessionRepository.ts#L59)).
- Logout reads `sessionId` from request body, loads Session, calls `revoke()`, calls repository `save()`, and clears cookies ([AuthController.ts](../modules/iam/src/presentation/http/controllers/AuthController.ts#L178), [LogoutUserHandler.ts](../modules/iam/src/application/commands/logout-user/LogoutUserHandler.ts#L17)). Session table has no revoked column and repository upsert does not persist `_revoked` ([Session.ts](../modules/iam/src/domain/Session.ts#L70), [sessions.table.ts](../modules/iam/src/infrastructure/database/schema/sessions.table.ts#L5), [DrizzleSessionRepository.ts](../modules/iam/src/infrastructure/repositories/DrizzleSessionRepository.ts#L33)). **INFERENCE:** logout revocation is not durable in this adapter; token invalidation through another mechanism is not visible. AuthGuard verifies access token without querying Session ([AuthGuard.ts](../modules/iam/src/presentation/http/middleware/AuthGuard.ts#L29)).
- Change-password loads User, compares current password, validates/hashes new password, saves User and publishes events; it does not invoke SessionRepository/revoke sessions ([ChangePasswordHandler.ts](../modules/iam/src/application/commands/change-password/ChangePasswordHandler.ts#L20)).

### OAuth, Telegram, Account Linking

- OAuth start checks registered provider, creates random state, stores it for non-Telegram providers, builds redirect, and sets state cookie ([InitiateOAuthHandler.ts](../modules/iam/src/application/commands/oauth-initiate/InitiateOAuthHandler.ts#L20), [OAuthController.ts](../modules/iam/src/presentation/http/controllers/OAuthController.ts#L51)).
- Callback compares state query/cookie and consumes it for non-Telegram providers, exchanges code, requires verified email if supplied, finds SocialIdentity by provider subject, otherwise looks up User by email and auto-links a matching existing User or creates a new User with a random generated password hash; then saves SocialIdentity, Session, and returns tokens via cookies ([OAuthController.ts](../modules/iam/src/presentation/http/controllers/OAuthController.ts#L78), [OAuthLoginHandler.ts](../modules/iam/src/application/commands/oauth-login/OAuthLoginHandler.ts#L39), [OAuthLoginHandler.ts](../modules/iam/src/application/commands/oauth-login/OAuthLoginHandler.ts#L85), [OAuthLoginHandler.ts](../modules/iam/src/application/commands/oauth-login/OAuthLoginHandler.ts#L145)). Whether automatic verified-email linking is approved policy is **NOT FROZEN**.
- Authenticated POST link calls `LinkSocialAccountHandler`, which checks whether provider subject belongs to another User. It does not consume the injected OAuthStateRepository. Controller comment mentions DELETE unlink, but no DELETE handler exists in inspected code ([OAuthController.ts](../modules/iam/src/presentation/http/controllers/OAuthController.ts#L156), [LinkSocialAccountHandler.ts](../modules/iam/src/application/commands/link-social-account/LinkSocialAccountHandler.ts#L12)).
- Telegram POST serializes request body for provider adapter, runs OAuthLogin, then returns full handler result as JSON; unlike callback path, it does not set cookies/strip tokens ([OAuthController.ts](../modules/iam/src/presentation/http/controllers/OAuthController.ts#L190)). Provider registration is conditional on bot token and username ([iam-container.ts](../apps/api/src/container/iam-container.ts#L223)).

### Magic Link

- Request route optionally checks IP rate limit, looks up User by email, returns generic success for unknown account, creates raw token + digest, saves digest, creates link containing raw token, publishes request event ([AuthController.ts](../modules/iam/src/presentation/http/controllers/AuthController.ts#L251), [SendMagicLinkHandler.ts](../modules/iam/src/application/commands/send-magic-link/SendMagicLinkHandler.ts#L19)).
- Verify route hashes raw token, loads by digest, checks expiry/consumed/purpose, conditionally updates consumed_at with `.returning()`, saves Session, generates tokens, saves Session again with refresh token, publishes consumed event ([VerifyMagicLinkHandler.ts](../modules/iam/src/application/commands/verify-magic-link/VerifyMagicLinkHandler.ts#L40), [DrizzleMagicLinkTokenRepository.ts](../modules/iam/src/infrastructure/repositories/DrizzleMagicLinkTokenRepository.ts#L65), [VerifyMagicLinkHandler.ts](../modules/iam/src/application/commands/verify-magic-link/VerifyMagicLinkHandler.ts#L77)). Handler has no IAM UoW injection; these steps are not one transaction in the visible flow.
- No-cache rate limiter allows requests ([iam-container.ts](../apps/api/src/container/iam-container.ts#L293), [RateLimiter.ts](../modules/iam/src/application/security/RateLimiter.ts#L18)). API container creates an email event handler conditionally but no `IamEventSubscriber`; subscriber `subscribe()` is a no-op; in-memory bus only stores events. Email delivery is not shown as reachable in this composition ([iam-container.ts](../apps/api/src/container/iam-container.ts#L298), [IamEventSubscriber.ts](../modules/iam/src/application/events/subscribers/IamEventSubscriber.ts#L21), [InMemoryIamEventBus.ts](../modules/iam/src/infrastructure/messaging/InMemoryIamEventBus.ts#L9)).

## 30. Identity-Centric Responsibility Comparison

| Capability         | Intended responsibility                                           | Current legacy IAM source                                                                                                                                              | Newer module source/reachability                         |
| ------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| User               | Global account/status; no tenant ownership.                       | `identities` row owns email, password hash/passwordSet/status/profile; aggregate carries roles and sessions.                                                           | New User is separated in source; not API-wired.          |
| EmailIdentity      | Separate canonical/verified email identity.                       | Email globally unique on `identities`; registration status starts unverified. Magic-link purpose includes email verification, but verify does not update email/status. | Aggregate/table/port present; no app flow/adapter.       |
| ExternalIdentity   | Provider subject/metadata only; no OAuth secrets.                 | SocialIdentity is separate but interface/table hold provider access/refresh token fields. OAuth login auto-links by matching verified email.                           | Separate aggregate/table/port present; not wired.        |
| PasswordCredential | Separate, stores pre-hashed password only.                        | PasswordHash and passwordSet are User fields/identity columns.                                                                                                         | Aggregate/table/port present; no mapper/repo/app flow.   |
| Session            | User-owned, hashed refresh token, revocation, no tenantId.        | Separate Session, raw refresh_token persisted, no revoked column, device/IP/user-agent fields and CASCADE FK.                                                          | New Session models hash/revocation/no tenant; not wired. |
| Tenant/Membership  | Independent Tenant and User↔Tenant Membership.                    | Legacy tenant owner/tier/slug/deletedAt; membership separate but text ID, incomplete FK declaration and different lifecycle.                                           | New aggregate/ports/schema present; not wired.           |
| Authorization      | Membership→Assignment→TenantRole→RolePermission→TenantPermission. | Legacy RBAC/ABAC, roles loaded into User, legacy tenant-specific tables.                                                                                               | New aggregates/ports/schema present; not wired.          |
| MFA                | Real enrollment/verification/recovery flow.                       | Event enums and empty migration placeholders; no handler/repository/controller found.                                                                                  | No integrated runtime found.                             |
| Magic Link         | Digest-only, purpose-bound, atomic consume and delivery.          | Partial token flow/SQL invariant; delivery and UoW composition incomplete.                                                                                             | No newer implementation found.                           |
| Account Linking    | Explicit authenticated link/unlink, provider ownership.           | Explicit POST link exists; OAuth login also auto-links by email; no unlink route.                                                                                      | No new flow found.                                       |

## 31. Source-only Evidence Boundary

This addendum traces current executable source only; it does not treat audit/README/phase Markdown as IAM implementation evidence. “Reachable” is based on static imports/router mounts and was not confirmed by sending requests. No tests, database operations, Cloud connection, build, or runtime server was executed. Forensic comments, worktree dirtiness, and untracked source mean current findings cannot be attributed to `HEAD` or production without release provenance.

## 33. No-Change Guarantee

Only this audit document was intentionally created by this task. No source code, config, `.env`, schema, migration, snapshot, journal, CI, deployment, or database change was made. No staged work was changed; nothing was added to or removed from the index. Existing staged/unstaged/untracked/deleted work was left untouched.

Because the worktree is highly dirty and many files are untracked, Git cannot establish their baseline provenance or prove they are in `HEAD`. The status inventory is a snapshot at audit time, not a clean release baseline. No cleanup or revert was performed.
