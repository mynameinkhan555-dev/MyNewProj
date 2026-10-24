# Repository Reference Pattern

## Phase 6W — Step 2B Checkpoint

**UserRepository qualification: 14/14 QUALIFIED**

The project owner reports that all 14 qualification cases passed against real PostgreSQL. The current workspace session could not replay the integration suite because `DATABASE_URL` is not configured; local replay status is therefore **NOT RUN**, not a contradictory test result.

Qualification evidence covers:

1. Find an existing ACTIVE user.
2. Find an existing SUSPENDED user.
3. Find an existing DELETED user.
4. Return `null` for a missing user.
5. Insert a valid user.
6. Convert a duplicate UUID constraint failure into `UniqueConstraintViolation`.
7. Update ACTIVE to SUSPENDED.
8. Update SUSPENDED to DELETED.
9. Throw the persistence not-found error when updating a missing user.
10. Round-trip between the domain aggregate and persistence row.
11. Commit on success.
12. Roll back on failure.
13. Reject repository access through an inactive `TransactionContext`.
14. Keep separate UoW instances isolated.

The corresponding integration suite is `modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.integration.test.ts`.

## Frozen Ownership

| Concern                        | Owner                                   | Rule                                                                                                                               |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Persistence contract           | Aggregate repository port in the domain | Expose only operations the application/domain needs; use aggregate types and typed IDs.                                            |
| Row/domain translation         | Aggregate mapper                        | Reconstruct without emitting events or applying business decisions; translate validated fields in both directions.                 |
| Query and write operations     | Aggregate repository adapter            | Use the injected `TransactionContext`; never open, commit, or roll back a transaction. Keep SQL predicates and table details here. |
| Transaction lifecycle          | `DrizzleUnitOfWork`                     | Activate context for the transaction, execute work, let Drizzle commit/rollback, and clear context.                                |
| PostgreSQL error translation   | `DrizzleUnitOfWork` boundary            | Translate recognized PostgreSQL SQLSTATEs into stable `PersistenceError` types; preserve non-database errors.                      |
| Domain rules and state changes | Aggregate/domain services               | Keep validation and business transitions out of the mapper and repository.                                                         |

## Reusable Pattern

```text
Domain repository port
    ↓ aggregate-specific contract
Drizzle repository adapter ← TransactionContext from UoW
    ├── query/write using aggregate table and mapper
    └── throw local persistence semantics (for example, update-not-found)
             ↓ raw database error
DrizzleUnitOfWork transaction boundary
    ├── commit or rollback through Drizzle
    ├── map PostgreSQL SQLSTATE to PersistenceError
    └── clear TransactionContext
```

Repository implementation shape:

1. Receive `TransactionContext` in the constructor.
2. Obtain the active transaction from `context.getTransaction()` for each operation.
3. Translate inputs with the aggregate mapper, execute Drizzle queries, and translate returned rows.
4. Define missing-row behavior per operation and aggregate contract; do not treat every zero-row update as a database constraint error.
5. Do not catch PostgreSQL errors in the repository. Let them reach the UoW boundary.
6. Test the repository together with its mapper, transaction context, UoW, and real database for critical persistence semantics.

## Copy Versus Specialize

**Copy as architectural invariants:** constructor-injected context, no repository-owned transactions, mapper-only translation, raw SQL errors passed to UoW, explicit missing-row behavior, and integration coverage for transaction semantics.

**Specialize per aggregate:** port method names and return types, ID/value-object conversions, table/schema, query predicates and ordering, relationship loading, mapper validation, insert/update shape, and not-found/conflict semantics. Do not introduce a generic base repository just to share CRUD syntax; add shared abstractions only when multiple implementations demonstrate the same behavior and contract.

The `UserRepository` reference is `modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.ts`; its domain contract is `modules/identity/src/domain/repositories/IUserRepository.ts`, and its mapper is `modules/identity/infrastructure/persistence/drizzle/mappers/user.mapper.ts`. `modules/tenant/src/domain/repositories/ITenantRepository.ts` illustrates aggregate-specific query needs (`findByName`) that should not be copied into every repository.

## Next Application

Apply this pattern to the next aggregate by first reviewing its domain port and aggregate invariants, then defining its persistence schema and mapper, implementing only its port operations, and adding focused UoW-backed integration tests. Preserve the frozen ownership boundaries; do not mechanically clone User-specific status, UUID, or missing-row behavior.

## Phase 6W — Step 3 Initial Selection

**Selected first repository: `PasswordCredentialRepository`.** This is a readiness-based ordering decision, not a statement of product priority.

Reasons to start here:

- Its aggregate and domain port already exist.
- Its Drizzle table and platform migration already exist, including the unique `user_id` constraint and foreign key to the qualified `users` table.
- The contract is bounded to `findById`, `findByUserId`, `insert`, `update`, and physical `delete`; it exercises both ID lookup and the aggregate-specific one-per-user rule.
- It builds directly on the qualified User persistence surface without inheriting User-specific status transitions or mapping behavior.

Before implementation, resolve these contract questions:

- Should `update` on a missing credential throw a not-found persistence error?
- Should deleting a missing credential be idempotent or throw?
- No application use case currently consumes `IPasswordCredentialRepository`; qualify the adapter with repository/UoW integration tests, and do not claim use-case coverage until a consumer is wired.
- Test fixtures must create the referenced User in PostgreSQL before inserting a credential. Use synthetic encoded hashes and do not log or expose the persisted hash in diagnostics.

The next implementation checkpoint should begin by answering the missing-row questions, then add the aggregate mapper and Drizzle adapter, followed by focused PostgreSQL qualification. Tenant remains a later candidate until the competing tenant schema/migration tracks are reconciled.

## Phase 6W — Step 3 Quality Gate and Contract Status

The reusable [Persistence Engineering Quality Gate](persistence-engineering-quality-gate.md) contains 128 checks across architecture, types, schema, security, transaction ownership, error handling, tests, code quality, release evidence, and credential-specific controls. Each check records Rule, Risk, Enforcement, Test, and Evidence. The gate is a manual standard for now, not implemented CI automation; its application to a repository must be evidenced check by check.

| Stage                       | Status                  | Evidence or blocker                                                                                                                                  |
| --------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| INSPECT                     | COMPLETE                | Aggregate, port, User reference, schema, migration, UoW, and consumer search reviewed.                                                               |
| CONTRACT REVIEW             | COMPLETE                | Five-method contract matrix prepared; update/delete missing-row behavior reviewed.                                                                   |
| SCHEMA/MIGRATION RESOLUTION | BLOCKED                 | Drizzle schema/snapshots omit migration-only constraints; journal/SQL inventory and migration runner behavior need resolution.                       |
| TYPE SAFETY BASELINE        | BLOCKED                 | Frozen `TransactionContext.getTransaction()` and UoW transaction boundaries use `any`; literal zero-any needs a behavior-preserving typing decision. |
| ERROR CONTRACT              | PROPOSED, NOT FROZEN    | Add `PasswordCredentialNotFoundError` under `PersistenceNotFoundError`, following the current User error pattern.                                    |
| DELETE SEMANTICS            | PROPOSED, NOT FROZEN    | Strict missing delete returns `PasswordCredentialNotFoundError`; application may translate that to idempotent success when required.                 |
| QUALITY GATE                | CREATED, REVIEW PENDING | 128 rules; no PasswordCredential implementation has been evaluated against it yet.                                                                   |
| CONTRACT FREEZE             | BLOCKED                 | Depends on schema/migration resolution and explicit approval of the proposed error/delete semantics.                                                 |
| IMPLEMENTATION              | NOT STARTED             | No PasswordCredential mapper, repository, or integration tests have been added.                                                                      |

### Migration Source Findings

`packages/platform-database/drizzle.config.ts` includes platform and module Drizzle schemas as `drizzle-kit generate` inputs and writes generated migrations under `packages/platform-database/migrations`. Thus the Drizzle declarations are the intended schema-generation model, while SQL files are the deployment history and snapshots are Drizzle's generation baseline. These representations are not currently coherent:

- The password credential table declaration and snapshots omit `UNIQUE(user_id)`, while `0000_identity.sql` contains `uq_password_credentials_user_id`.
- The User status CHECK is also present in `0000_identity.sql` but absent from the User Drizzle declaration and snapshot. This indicates a broader migration-only constraint pattern, not an isolated repository issue.
- `meta/_journal.json` has a `0004_talented_rhodey` entry, but the migration directory has no matching `0004_*.sql` file.
- The custom `scripts/apply-migrations.js` runner scans `.sql` files and ignores the journal. It catches individual SQL statement failures, logs them, continues, and can still print “All migrations applied successfully.” Its current success message is therefore not reliable migration evidence.

Do not edit historical migrations, snapshots, journal entries, or constraints as part of repository implementation until the canonical migration path and a forward-only repair strategy are approved. Any schema repair must account for databases where the manually declared unique constraint already exists and must be tested on both clean and upgraded database states.

### Proposed Credential Contract

| Method                 | Proposed behavior                                                                        | State    |
| ---------------------- | ---------------------------------------------------------------------------------------- | -------- |
| `findById(id)`         | Return aggregate or `null`; do not filter on User status.                                | REVIEWED |
| `findByUserId(userId)` | Return aggregate or `null`; rely on the database unique constraint for at-most-one.      | REVIEWED |
| `insert(credential)`   | Map and insert through active context; let DB violations reach UoW.                      | REVIEWED |
| `update(credential)`   | Update existing row; 0 rows throws `PasswordCredentialNotFoundError`.                    | PROPOSED |
| `delete(id)`           | Physical delete through active context; 0 rows throws `PasswordCredentialNotFoundError`. | PROPOSED |

The specific not-found subtype is not present today. The proposal is to derive it from `PersistenceNotFoundError`, alongside `UserNotFoundError`, without changing the domain port's dependency direction. No application consumer currently exists; repository/UoW/PostgreSQL qualification is sufficient for this phase, and no artificial use case will be added.
