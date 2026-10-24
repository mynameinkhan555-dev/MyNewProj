# Phase 6W — Step 3

# Migration Authority and History Integrity Investigation

**Scope:** INSPECT → TRACE → PROVE → DOCUMENT → PROPOSE. No repository, mapper, schema, migration, journal, or snapshot was modified. No database command was run.

## 1. Executive Summary

**Finding: CONTRACT BLOCKED.** The repository does not currently have one demonstrably canonical migration path for the new platform/module schema.

Three distinct paths exist:

1. Root `pnpm db:migrate` invokes `@workspace/migration-runtime`, whose default migration directory is the legacy `modules/iam/src/infrastructure/database/migrations`; it uses a database fingerprint and a custom `__drizzle_migrations` ledger.
2. `pnpm --filter @workspace/platform-database db:migrate` invokes Drizzle Kit/ORM. The configured output folder is `packages/platform-database/migrations`, but the journal tags do not match the SQL filenames. The resolved ORM migrator requires the journal-tagged file and fails on the first entry.
3. `pnpm --filter @workspace/platform-database db:apply-migrations` runs a custom SQL-file glob over the four files present. It ignores the journal and can report success after SQL statement failures.

Drizzle Kit generation is demonstrably configured to load the platform schema plus the three module-owned schema barrels. The password credential UNIQUE, however, is in deployment SQL and in neither the Drizzle declaration nor snapshots. Other constraints have both directions of DSL/SQL/snapshot drift. The live database catalog was **NOT VERIFIED — `DATABASE_URL` unavailable**.

The project files establish desired behavior in some places, but they do not establish which of these runners is authoritative for the module schema. That decision must precede schema repair or repository qualification.

## 2. Migration Architecture

| Command                                                          | Actual target/mechanism                                                                             | Evidence and consequence                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root `pnpm db:migrate`                                           | `scripts/src/migrate.ts` → `MigrationRunner`; default directory is the legacy IAM migration folder. | Root script is [package.json](../../package.json#L21); CLI default is [migrate.ts](../../scripts/src/migrate.ts#L16). It does not target the platform Drizzle migrations by default.                                                                                            |
| `pnpm --filter @workspace/platform-database db:generate`         | Drizzle Kit `generate`, configured schemas and output below.                                        | [platform-database package.json](../../packages/platform-database/package.json#L18), [drizzle.config.ts](../../packages/platform-database/drizzle.config.ts#L4).                                                                                                                |
| `pnpm --filter @workspace/platform-database db:migrate`          | Drizzle Kit `migrate`, which reads the migration journal and tagged SQL files.                      | [platform-database package.json](../../packages/platform-database/package.json#L19); installed reader behavior in [migrator.js](../../packages/platform-database/node_modules/drizzle-orm/migrator.js#L17). Current journal/file mismatch prevents loading the first migration. |
| `pnpm --filter @workspace/platform-database db:push`             | Drizzle Kit direct schema push command.                                                             | [platform-database package.json](../../packages/platform-database/package.json#L20). Not run; this bypasses the recorded migration sequence and was not used for this investigation.                                                                                            |
| `pnpm --filter @workspace/platform-database db:apply-migrations` | Custom runner globs and executes every `*.sql` in lexical order.                                    | [apply-migrations.js](../../packages/platform-database/scripts/apply-migrations.js#L23). It is not journal-aware.                                                                                                                                                               |

`pnpm-workspace.yaml` includes `packages/platform-database`, `packages/migration-runtime`, and `scripts`. Neither `turbo.json` nor `nx.json` exists at the workspace root. `platform-database` declares `dotenv` and `DATABASE_URL` in its config; no migrations table/schema, extensions, or explicit schema-search-path option is set there. `out` is `./migrations`, dialect is PostgreSQL. Config evidence: [drizzle.config.ts](../../packages/platform-database/drizzle.config.ts#L4).

## 3. Drizzle Source-of-Truth

**Proven for generation input:** `drizzle.config.ts` lists exactly four schema entries: `./src/schema/index.ts`, and the identity, tenant, and access-control module schema barrels. It sets output to `./migrations`, PostgreSQL dialect, and `process.env.DATABASE_URL`. Therefore Drizzle Kit generation serializes those files as its desired schema model; this is not inferred from naming alone.

The resolved `drizzle-kit` for `platform-database` is version `0.22.8`; the package declares `^0.22.8`. Its bundled generator prepares the previous PostgreSQL snapshot and serializes the configured schema before diffing; it writes a snapshot, journal entry, and `${tag}.sql` together. See installed [drizzle-kit package metadata](../../packages/platform-database/node_modules/drizzle-kit/package.json#L1), generator snapshot preparation in [bin.cjs](../../packages/platform-database/node_modules/drizzle-kit/bin.cjs#L22684), and generation writes in [bin.cjs](../../packages/platform-database/node_modules/drizzle-kit/bin.cjs#L30733).

**Not proven:** that this Drizzle-generated path is the production-authoritative migration path for the repository. Root `db:migrate` instead targets the legacy IAM migration runtime by default (section 2). Thus “Drizzle schema is the project-wide migration authority” is not established by current commands.

The config contains no explicit `migrationsSchema` or `migrationsTable`. In the resolved Drizzle ORM `0.33.0`, PostgreSQL migrator defaults to schema `drizzle`, table `__drizzle_migrations`, creates the schema/table, reads latest `created_at`, then applies newer journal migrations transactionally. Evidence: installed [pg-core dialect](../../packages/platform-database/node_modules/drizzle-orm/pg-core/dialect.js#L39). The project custom `JournalManager` also calls its table `__drizzle_migrations`, but does not schema-qualify it and declares an additional `name` field; actual DB/search-path interaction is **NOT VERIFIED**.

## 4. Schema ↔ Migration Drift

The module schemas audited are the actual config paths. Their barrels export the identity tables, tenant tables, and access-control tables. Platform's own schema barrel exports outbox tables. Module barrels: [identity schema index](../../modules/identity/infrastructure/persistence/drizzle/schema/index.ts#L1), [tenant schema index](../../modules/tenant/infrastructure/persistence/drizzle/schema/index.ts#L1), [access-control schema index](../../modules/access-control/infrastructure/persistence/drizzle/schema/index.ts#L1), [platform schema index](../../packages/platform-database/src/schema/index.ts#L1).

All declared FK references inspected use `ON DELETE RESTRICT`; no audited schema declares Drizzle `relations()` objects. The SQL migrations likewise use `RESTRICT` for business FKs. The complete table inventory is summarized here; `declared` means present in Drizzle DSL, `SQL` means present in migration SQL, and snapshots are assessed separately below.

| Module/table                    | Drizzle-declared keys and constraints                           | SQL-only or divergent declarations                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity `users`                | PK `id`; NOT NULL columns.                                      | SQL `chk_users_status` CHECK is missing in DSL/snapshots. [schema](../../modules/identity/infrastructure/persistence/drizzle/schema/users.table.ts#L11), [SQL](../../packages/platform-database/migrations/0000_identity.sql#L6).                                                                                                                    |
| Identity `email_identities`     | PK, RESTRICT user FK, UNIQUE email, user index.                 | SQL partial UNIQUE `(user_id) WHERE primary=true` is SQL-only. Declared email unique semantics exist in snapshot, but generated and SQL constraint names differ. [schema](../../modules/identity/infrastructure/persistence/drizzle/schema/email-identities.table.ts#L17), [SQL](../../packages/platform-database/migrations/0000_identity.sql#L79). |
| Identity `external_identities`  | PK, RESTRICT user FK.                                           | SQL index on `user_id` and UNIQUE `(provider, provider_subject)` are absent from DSL. [schema](../../modules/identity/infrastructure/persistence/drizzle/schema/external-identities.table.ts#L12), [SQL](../../packages/platform-database/migrations/0000_identity.sql#L32).                                                                         |
| Identity `password_credentials` | PK, RESTRICT user FK.                                           | UNIQUE `uq_password_credentials_user_id` is absent from DSL. [schema](../../modules/identity/infrastructure/persistence/drizzle/schema/password-credentials.table.ts#L12), [SQL](../../packages/platform-database/migrations/0000_identity.sql#L40).                                                                                                 |
| Identity `sessions`             | PK, RESTRICT user FK, user and expiry indexes.                  | No other SQL-only key found in this table. [schema](../../modules/identity/infrastructure/persistence/drizzle/schema/sessions.table.ts#L21), [SQL](../../packages/platform-database/migrations/0000_identity.sql#L83).                                                                                                                               |
| Tenant `tenants`                | PK.                                                             | SQL `chk_tenants_status` CHECK is absent in DSL/snapshots. [schema](../../modules/tenant/infrastructure/persistence/drizzle/schema/tenants.table.ts#L11), [SQL](../../packages/platform-database/migrations/0001_tenant.sql#L7).                                                                                                                     |
| Tenant `memberships`            | PK, RESTRICT user and tenant FKs.                               | SQL user/tenant indexes and partial UNIQUE `(user_id, tenant_id) WHERE status='ACTIVE'` absent from DSL. [schema](../../modules/tenant/infrastructure/persistence/drizzle/schema/memberships.table.ts#L15), [SQL](../../packages/platform-database/migrations/0001_tenant.sql#L32).                                                                  |
| Access `permissions`            | PK, UNIQUE `key`, scope/status CHECKs.                          | SQL semantics align, but latest snapshot lacks these constraints. [schema](../../modules/access-control/infrastructure/persistence/drizzle/schema/permissions.table.ts#L37), [SQL](../../packages/platform-database/migrations/0002_authorization.sql#L11), [snapshot](../../packages/platform-database/migrations/meta/0004_snapshot.json#L564).    |
| Access `tenant_roles`           | PK, RESTRICT tenant FK, UNIQUE `(tenant_id,key)`, status CHECK. | SQL semantics align, but latest snapshot lacks UNIQUE/CHECK. [schema](../../modules/access-control/infrastructure/persistence/drizzle/schema/tenant-roles.table.ts#L29), [SQL](../../packages/platform-database/migrations/0002_authorization.sql#L25), [snapshot](../../packages/platform-database/migrations/meta/0004_snapshot.json#L628).        |
| Access `role_assignments`       | PK, RESTRICT membership/role FKs, status CHECK.                 | SQL partial UNIQUE active membership/role pair and two indexes are absent from DSL; latest snapshot omits CHECK/index. [schema](../../modules/access-control/infrastructure/persistence/drizzle/schema/role-assignments.table.ts#L16), [SQL](../../packages/platform-database/migrations/0002_authorization.sql#L80).                                |
| Access `role_permissions`       | Two RESTRICT FKs; no PK declaration.                            | SQL composite PK `(role_id, permission_id)` and both indexes are absent from DSL/snapshots. [schema](../../modules/access-control/infrastructure/persistence/drizzle/schema/role-permissions.table.ts#L11), [SQL](../../packages/platform-database/migrations/0002_authorization.sql#L43).                                                           |
| Platform `outbox_events`        | PK, CHECKs, indexes declared by platform table schema.          | SQL includes those constraints/indexes; compare exact metadata before any migration repair. [schema](../../packages/platform-database/src/schema/outbox-events.table.ts#L1), [SQL](../../packages/platform-database/migrations/0003_outbox.sql#L1).                                                                                                  |
| Platform `event_consumption`    | Composite PK, RESTRICT FK, declared in platform schema.         | SQL includes same classes of constraints. [schema](../../packages/platform-database/src/schema/event-consumption.table.ts#L1), [SQL](../../packages/platform-database/migrations/0003_outbox.sql#L21).                                                                                                                                               |

**Origin confidence:** SQL existence and DSL absence are direct file facts. Several DSL comments explicitly say “added manually in migration,” but that does not establish who added them, when, or by which command. For those, historical origin is **UNKNOWN**; the comment is provenance evidence only, not proof. Constraint-name equivalence is not assumed where only semantic similarity was compared.

## 5. Snapshot Analysis

Snapshots are under `packages/platform-database/migrations/meta/`. Each has `version: 7`, `dialect: postgresql`, an `id`, a `prevId`, and serialized tables/columns/indexes/FKs/unique constraints/composite keys. The installed Drizzle Kit generator reads the previous snapshot as its diff baseline, serializes the configured schema, then writes the new snapshot with the SQL and journal entry. These roles are supported by [generator source](../../packages/platform-database/node_modules/drizzle-kit/bin.cjs#L22684) and [write path](../../packages/platform-database/node_modules/drizzle-kit/bin.cjs#L30733).

The existing `id` chain is continuous: `0000` has zero `prevId`; `0001.prevId = 0000.id`; `0002.prevId = 0001.id`; `0003.prevId = 0002.id`; `0004.prevId = 0003.id`. See [0000](../../packages/platform-database/migrations/meta/0000_snapshot.json#L2), [0001](../../packages/platform-database/migrations/meta/0001_snapshot.json#L2), [0002](../../packages/platform-database/migrations/meta/0002_snapshot.json#L2), [0003](../../packages/platform-database/migrations/meta/0003_snapshot.json#L2), [0004](../../packages/platform-database/migrations/meta/0004_snapshot.json#L2).

Specific inconsistencies:

- Every snapshot from `0000` through `0004` records no UNIQUE constraint for `password_credentials`; the `0000` entry is visible at [0000 snapshot](../../packages/platform-database/migrations/meta/0000_snapshot.json#L194), while SQL `0000` declares one.
- `users` snapshots omit the SQL status CHECK.
- `0002`/`0003`/`0004` snapshots omit SQL-defined active partial unique indexes and composite PK for membership/role assignment/role permissions.
- Latest `0004` snapshot omits schema- and SQL-declared `permissions` UNIQUE/CHECK and `tenant_roles` UNIQUE/CHECK.
- `0004_snapshot` contains outbox tables also created by `0003_outbox.sql`, but is linked to journal idx 4 whose tag has no SQL file. **INFERENCE:** the snapshot was generated/retained without its matching SQL artifact or filenames/history were subsequently altered. Repository evidence does not establish which cause occurred.

No snapshot timestamp field is present in the snapshot JSON; the related journal entry has a `when` timestamp. Snapshot creation chronology beyond chain order is **NOT VERIFIED**.

## 6. Journal Analysis

`meta/_journal.json` has `version: 7`, `dialect: postgresql`, and entries with `idx`, `version`, `when`, `tag`, and `breakpoints`. Current entries:

| idx | tag                        |          when | breakpoints | Matching `<tag>.sql` exists? |
| --: | -------------------------- | ------------: | ----------- | ---------------------------- |
|   0 | `0000_open_avengers`       | 1790776145562 | true        | No                           |
|   1 | `0001_thin_wilson_fisk`    | 1790776170271 | true        | No                           |
|   2 | `0002_little_hedge_knight` | 1790776870564 | true        | No                           |
|   3 | `0003_abandoned_fenris`    | 1790777200262 | true        | No                           |
|   4 | `0004_talented_rhodey`     | 1790777686736 | true        | No                           |

Entries are in [_journal.json](../../packages/platform-database/migrations/meta/_journal.json#L6); the only SQL files present are `0000_identity.sql`, `0001_tenant.sql`, `0002_authorization.sql`, and `0003_outbox.sql`. Drizzle Kit normally writes the journal tag and matching SQL filename together; this checkout does not satisfy that generated-artifact relationship.

The Drizzle journal is generation/migration-file metadata, not by itself proof that a database applied those migrations. Drizzle ORM separately records applied migration hashes/timestamps in a DB table. The root custom migration runtime has its own `JournalManager` records (name, hash, created_at) and calls that table `__drizzle_migrations`; those are separate mechanisms despite sharing the table name.

## 7. Migration Runner Analysis

### Root command runtime

Root `db:migrate` invokes the custom `MigrationRunner`. [migrate.ts](../../scripts/src/migrate.ts#L16) defaults to `modules/iam/src/infrastructure/database/migrations`; it loads an expected fingerprint unless `SKIP_FINGERPRINT=true`, then exits nonzero for unsuccessful results. [runner.ts](../../packages/migration-runtime/src/runner.ts#L63) ensures its DB journal table, obtains an advisory lock, and routes an empty journal plus expected fingerprint into baseline mode. Baseline mode fingerprints the already-present schema and journals historical migrations instead of applying them; mismatch returns failure. [runner.ts](../../packages/migration-runtime/src/runner.ts#L79), [runner.ts](../../packages/migration-runtime/src/runner.ts#L122).

Normal mode discovers SQL files, checks that every DB-journaled migration exists on disk, rejects hash mismatches, and executes pending migrations. Future `Atomic` migration SQL plus journal insert are in a DB transaction; legacy migration execution and subsequent journal insertion are separate operations. [runner.ts](../../packages/migration-runtime/src/runner.ts#L198), [runner.ts](../../packages/migration-runtime/src/runner.ts#L257). The CLI exits nonzero for `{success:false}` or thrown failures. [migrate.ts](../../scripts/src/migrate.ts#L42).

### Platform custom SQL-glob runner

[apply-migrations.js](../../packages/platform-database/scripts/apply-migrations.js#L23) sorts every `.sql` file in the output folder; it never reads `_journal.json`, checks prior DB history, uses a transaction, or writes migration history. It splits on statement breakpoints and catches each `sql.unsafe()` exception, logs it, then continues. [apply-migrations.js](../../packages/platform-database/scripts/apply-migrations.js#L35). After all files, it prints “All migrations applied successfully.” [apply-migrations.js](../../packages/platform-database/scripts/apply-migrations.js#L52). Therefore **yes, this runner can report success despite failed SQL statements**. Only outer failures reach the final catch and exit 1. Partial execution is possible; retry behavior depends on each statement's idempotency.

### Drizzle Kit/ORM path

The installed ORM reader loops over journal entries and reads `${tag}.sql`; a missing file throws `No file ... found`. [migrator.js](../../packages/platform-database/node_modules/drizzle-orm/migrator.js#L24). Since idx 0's tag has no matching file, Drizzle `migrate` cannot load the migration list in the current checkout. It fails before execution/journal update. The resolved PostgreSQL dialect records each migration in `drizzle.__drizzle_migrations` only within the migration transaction after executing statements. [dialect.js](../../packages/platform-database/node_modules/drizzle-orm/pg-core/dialect.js#L39).

No runner was executed in this investigation; all behaviors above are established by inspected source, not a runtime test.

## 8. PasswordCredential UNIQUE(user_id) Root Cause

| Artifact                  | Exists?                       | Name / role                                                                     | Evidence                                                                                                                                                                                       |
| ------------------------- | ----------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drizzle table declaration | No UNIQUE declaration         | Comment says one-user UNIQUE was added manually; table has PK and user FK only. | [password-credentials.table.ts](../../modules/identity/infrastructure/persistence/drizzle/schema/password-credentials.table.ts#L12)                                                            |
| Platform migration SQL    | Yes                           | `uq_password_credentials_user_id`, table constraint `UNIQUE("user_id")`.        | [0000_identity.sql](../../packages/platform-database/migrations/0000_identity.sql#L40)                                                                                                         |
| Snapshots 0000–0004       | No                            | Each `password_credentials` metadata has empty unique-constraint/index records. | [0000 snapshot](../../packages/platform-database/migrations/meta/0000_snapshot.json#L229) and latest [0004 snapshot](../../packages/platform-database/migrations/meta/0004_snapshot.json#L360) |
| Drizzle journal           | No direct constraint metadata | Records migration tags/order/time/breakpoints, not individual constraints.      | [_journal.json](../../packages/platform-database/migrations/meta/_journal.json#L1)                                                                                                             |
| DB introspection          | NOT VERIFIED                  | `DATABASE_URL` is absent in this environment.                                   | Environment check returned `DATABASE_URL_PRESENT=False`.                                                                                                                                       |

**Proven root cause at repository artifact level:** the schema declaration and snapshots do not model the invariant, while `0000_identity.sql` does. The declaration comment calls it manual. **Historical origin:** UNKNOWN. Whether production/current DBs contain it is **NOT VERIFIED**.

## 9. Clean DB Scenario

There is no single outcome because commands route to different systems:

- Root `pnpm db:migrate` defaults to the legacy IAM migration runtime. With its normal fingerprint configuration and an empty execution journal, it selects baseline verification, which expects the schema fingerprint to match an already-present baseline; an empty database is not established as a supported “apply all platform migrations from zero” route. `SKIP_FINGERPRINT=true` changes that path, but targets the IAM directory, not `packages/platform-database/migrations`.
- Drizzle `db:migrate` cannot load idx 0 because `0000_open_avengers.sql` is missing; no platform migration SQL is applied.
- `db:apply-migrations` sees and attempts the four present SQL files in lexical order; it ignores journal idx 4. It can partially apply failures and still return success.
- `db:push` is configured but was not run; actual target schema state cannot be stated without DB access.

Thus clean-DB reproduction for the platform schema is **BLOCKED by migration authority/history integrity**, not merely untested.

## 10. Existing DB Scenario

Live state is **NOT VERIFIED — DATABASE_URL unavailable**. The repository does not establish which of the three paths created any existing database or which ledger/schema/search path it uses.

- Drizzle migrator fails while reading missing tagged files before checking/appplying DB history.
- Platform SQL-glob runner replays all four files; `IF NOT EXISTS` protects some creates/indexes, and selected FK blocks catch `duplicate_object`, but the runner has no applied-history filter or whole-run transaction and suppresses statement errors.
- Root migration runtime compares stored migration names/hashes, fails on missing journaled files/hash mismatch, and uses baseline fingerprint logic. It points at legacy IAM files by default.

**INFERENCE — duplicate UNIQUE risk:** latest Drizzle snapshot lacks `password_credentials.user_id` UNIQUE. If that invariant is added to the Drizzle DSL and Kit generates from that snapshot, the generated diff is expected to contain a new uniqueness operation. An already-migrated database produced by `0000_identity.sql` may already have `uq_password_credentials_user_id`; applying a generated constraint without first checking the actual catalog can create a redundant unique index/constraint or fail on a name collision. The exact generated SQL, actual constraint name, and DB outcome are **NOT VERIFIED**. Do not claim either safety or deterministic failure without generation preview plus PostgreSQL catalog inspection.

## 11. Migration Safety Recommendation

| Option                                  | Risk                                                                                                                   | Benefit                                                                                                   | Required change                                                                                                                         | Compatibility                                                                           | Rollback concern                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A. Repair desired Drizzle schema        | Large diff may surface all manual constraints at once; generator may emit operations for already-deployed constraints. | Schema model becomes complete and future diffs meaningful.                                                | Declare all intended module invariants, then generate against a reviewed baseline; do not alter deployed history.                       | Forward-compatible only after generated SQL is reconciled with each supported DB state. | Reverting DSL does not reverse applied DDL; destructive downgrade is not implied.             |
| B. Repair old history                   | Rewriting/deleting applied SQL, journal, or snapshots can invalidate hashes, installations, and provenance.            | Could make one historical sequence internally consistent if exact canonical artifacts are recoverable.    | Only recover byte-identical authoritative artifacts with provenance; otherwise do not rewrite.                                          | Poor for databases that already applied another form.                                   | High: rollback cannot restore unknown deployment histories safely.                            |
| C. Forward-only corrective migration    | Existing data may violate newly enforced invariants; duplicate constraints/names possible.                             | Preserves immutable applied history and makes future DB state explicit.                                   | After choosing a runner, preflight existing duplicates/catalog objects; produce idempotent, reviewed DDL and test clean + upgraded DBs. | Can support clean and existing DBs with guarded migration logic.                        | Unique/FK/check changes can block writes; any rollback needs explicit data/constraint policy. |
| D. Repair/standardize migration tooling | Choosing one path may affect deployment pipelines and ledgers.                                                         | Establishes one reproducible authority, integrity checks, fail-closed errors, and meaningful exit status. | Select canonical runner/directory/ledger; enforce journal-file parity, fail on statement errors, and transaction/ledger policy.         | Requires a controlled transition for the legacy IAM runtime and platform migrations.    | Preserve old ledger/history; avoid silently switching the runner on existing environments.    |

**Recommended order:** D decision and runner integrity first; A desired schema completeness next; C append-only correction after DB inventory; B only if exact provenance is recovered, otherwise reject. No option was implemented here.

## 12. Persistence Error Hierarchy

Located in [PersistenceError.ts](../../packages/platform-database/src/persistence/PersistenceError.ts); barrel exports are [persistence/index.ts](../../packages/platform-database/src/persistence/index.ts#L1).

1. `PersistenceError extends Error`, carrying stable `code` and optional `constraint`.
2. `PersistenceNotFoundError extends PersistenceError`.
3. `UserNotFoundError extends PersistenceNotFoundError`; there is no `PasswordCredentialNotFoundError` today.
4. `UniqueConstraintViolation`, `ForeignKeyViolation`, `NotNullViolation`, and `CheckConstraintViolation` extend `PersistenceError`.
5. PostgreSQL mapping is in `DrizzleUnitOfWork.mapPersistenceError()`, [DrizzleUnitOfWork.ts](../../packages/platform-database/src/unitOfWork/DrizzleUnitOfWork.ts#L49). Repository operations do not implement PostgreSQL mapping; `DrizzleUserRepository` has no catch/mapping path and delegates queries through context. [user.repository.ts](../../modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.ts#L46).
6. SQLSTATE class `23` is matched by `^23\d{3}$`. `23505`, `23503`, `23502`, `23514` map to their dedicated types. Other class-23 codes map to base `PersistenceError` with `PERSISTENCE_ERROR` and available message/constraint.
7. Errors with no matching class-23 code are rethrown unchanged by the UoW mapper. The catch surrounds `db.transaction()`, so this rule applies to the error object surfaced at that boundary.

## 13. PasswordCredential Error Contract — PROPOSED

**PROPOSED ≠ FROZEN.** No implementation is authorized by this report.

| Operation               | Proposed contract                 | Reason/status                                                                                         |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `findById(missing)`     | `null`                            | Port return type already says nullable. REVIEWED.                                                     |
| `findByUserId(missing)` | `null`                            | Port return type already says nullable. REVIEWED.                                                     |
| `update(missing)`       | `PasswordCredentialNotFoundError` | Strict mutation of an aggregate that must exist; follows User adapter’s zero-row precedent. PROPOSED. |
| `delete(missing)`       | `PasswordCredentialNotFoundError` | Strict repository existence semantics proposed below. PROPOSED, not frozen.                           |

If approved, `PasswordCredentialNotFoundError` should derive from the existing `PersistenceNotFoundError`, not introduce a parallel hierarchy. This keeps application-facing semantics specific without moving SQLSTATE mapping from the UoW. The current port documents physical deletion but does not specify missing-row behavior. Evidence: [IPasswordCredentialRepository.ts](../../modules/identity/src/domain/repositories/IPasswordCredentialRepository.ts#L18), [PersistenceError.ts](../../packages/platform-database/src/persistence/PersistenceError.ts#L55).

## 14. Delete Semantics — PROPOSED

Physical deletion of PasswordCredential is documented by the existing port; this review does not freeze missing-row semantics.

- **Strict:** existing → success; missing → `PasswordCredentialNotFoundError`. Lets the repository report persistence existence precisely. Application may catch that typed not-found and translate “already absent” to idempotent success when a use-case policy requires it.
- **Idempotent:** existing → success; missing → success. Simpler for repeated calls, but discards whether an expected aggregate existed and cannot support strict callers through this port without another operation.

**Proposal:** strict repository behavior, with idempotency policy in Application. **Status: PROPOSED, NOT FROZEN.** No consumer exists to resolve product-specific policy.

## 15. Zero-Any Type Boundary Findings

`IUnitOfWork` has no `any`; its contract remains `execute<T>(work: () => Promise<T>): Promise<T>`. [IUnitOfWork.ts](../../packages/platform/src/ports/IUnitOfWork.ts#L24).

| File / line                                                                                                                                           | Current type              | Why present                                                         | Risk                                                | Possible type-safe replacement (proposal only)                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [TransactionContext.ts](../../packages/platform-database/src/unitOfWork/TransactionContext.ts#L32)                                                    | `private tx: any \| null` | Stores Drizzle transaction without a declared generic type.         | Operations gain unchecked methods/columns.          | Generic context over infrastructure transaction type, threaded from composition root; do not expose Drizzle type in Application. |
| [TransactionContext.ts](../../packages/platform-database/src/unitOfWork/TransactionContext.ts#L62)                                                    | `activate(tx: any)`       | Accepts UoW callback transaction.                                   | Any caller can activate with arbitrary shape.       | Generic `activate(TTransaction)` and constructor/factory wiring with concrete infra type.                                        |
| [TransactionContext.ts](../../packages/platform-database/src/unitOfWork/TransactionContext.ts#L102)                                                   | `getTransaction(): any`   | Returns stored transaction to repositories.                         | Any propagates into every adapter query chain.      | Typed generic return, with module adapter retaining schema-aware transaction type at infra boundary.                             |
| [DrizzleUnitOfWork.ts](../../packages/platform-database/src/unitOfWork/DrizzleUnitOfWork.ts#L38)                                                      | `db: any`                 | DB client injected without schema/client type.                      | Transaction callback and errors become unchecked.   | Generic DB client constrained to a transaction-capable Drizzle client type, implemented only in infrastructure.                  |
| [DrizzleUnitOfWork.ts](../../packages/platform-database/src/unitOfWork/DrizzleUnitOfWork.ts#L49)                                                      | `error: any`              | Driver/ORM error is inspected for optional SQLSTATE/cause fields.   | Unsafe property traversal.                          | Accept `unknown`, narrow to safe object/record guards and inspect cause chain; `unknown` alone is not a complete fix.            |
| [DrizzleUnitOfWork.ts](../../packages/platform-database/src/unitOfWork/DrizzleUnitOfWork.ts#L136)                                                     | callback `tx: any`        | Transaction callback annotation erases inferred driver transaction. | Same unsafe transaction type crosses context.       | Let DB generic infer callback tx and pass typed generic to context.                                                              |
| [DrizzleUnitOfWork.ts](../../packages/platform-database/src/unitOfWork/DrizzleUnitOfWork.ts#L151)                                                     | `catch (error: any)`      | Explicit catch annotation.                                          | Suppresses unknown/error narrowing.                 | Catch as `unknown`, narrow in a dedicated guard.                                                                                 |
| [drizzle-client.ts](../../packages/platform-database/src/drizzle-client.ts#L30)                                                                       | `schema: any`             | Schema composition factory accepts unconstrained module schema.     | Misspelled/incomplete schema can be accepted.       | Generic schema parameter satisfying Drizzle schema shape and preserve inferred DB type.                                          |
| [user.repository.integration.test.ts](../../modules/identity/infrastructure/persistence/drizzle/repositories/user.repository.integration.test.ts#L38) | test DB fixture `any`     | Integration setup does not preserve inferred composed schema.       | Test misses same type defects as production wiring. | Infer factory return type or use a test-only typed DB alias.                                                                     |
| [runner.ts](../../packages/migration-runtime/src/runner.ts#L17)                                                                                       | `catalog?: any`           | Fingerprint catalog shape left open.                                | Migration integrity code loses catalog guarantees.  | Define a catalog snapshot type from introspector/normalizer.                                                                     |
| [runner.ts](../../packages/migration-runtime/src/runner.ts#L228)                                                                                      | `journalEntries: any[]`   | DB journal row type is not reused.                                  | Incorrect history records are accepted.             | Use `JournalEntry[]` exported from journal module.                                                                               |

Search also found `as any` in `unitOfWork.test.ts`; these are test doubles for opaque transaction contexts, not in `IUnitOfWork`. Existing `UserRepository` has no `any` type annotation; its word “any” in one comment means all User statuses. No PasswordCredential adapter exists to audit yet.

TYP-01 is a manual quality-gate rule; TYP-02/TYP-03 also apply. A safe zero-any implementation needs an approved type boundary through platform-database/infrastructure. Do not cast or leak Drizzle types into domain/application just to satisfy the rule.

## 16. Quality Gate Mapping

The current [quality gate](persistence-engineering-quality-gate.md) contains 128 IDs. Relevant exact IDs:

- Schema/SQL/snapshot drift: `DB-01`, `DB-04`, `DB-08`, `DB-10`, `DB-12`.
- Journal-to-file mismatch: `DB-03`; migration generation and deployed-history compatibility: `DB-02`, `REL-06`, `REL-07`.
- Runner swallowing SQL failures: `DB-19`; verification/claims: `REL-02`, `REL-08`, `REL-10`.
- `any`/unsafe boundary: `TYP-01`, `TYP-02`, `TYP-03`; schema composition typing: `ARC-09`.
- Error translation boundary: `ERR-01`–`ERR-04`, `ERR-09`.
- Real PostgreSQL constraints and history qualification: `DB-18`, `DB-20`, `TEST-05`–`TEST-08`, `TEST-18`–`TEST-20`.
- Credential hash controls: `CRED-01`–`CRED-10`.

The gate is currently a manual standard, not an implemented CI enforcement system, as stated in its Purpose section. None of these rules is marked passed for this investigation without evidence.

## 17. Architecture Conflicts

| Existing rule                                                                                                                                     | New evidence                                                                                                                                                         | Conflict                                                                                                        | Recommended resolution                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repository-reference-pattern.md` says Drizzle declarations are the intended generation model and calls SQL migration history deployment history. | Root `pnpm db:migrate` actually routes to the legacy IAM `MigrationRunner`; platform Drizzle migrate has broken tag/file mapping; custom SQL runner is another path. | The guide accurately describes Drizzle Kit's configured input, but overstates it as the project-wide authority. | Keep frozen persistence ownership unchanged. Obtain an architecture-owner decision selecting/transitioning the migration runner before amending authority wording or repairing schema/history. |
| Quality gate says zero `any`; frozen context/UoW/client APIs expose `any`.                                                                        | Exact declarations listed in section 15.                                                                                                                             | New repository can inherit unchecked transaction type without adding a local `any`.                             | Approve a behavior-preserving generic infrastructure type boundary, or formally scope the gate with an explicit tracked exception. Do not alter `IUnitOfWork`.                                 |
| Frozen migration/history principle says do not rewrite applied history.                                                                           | Journal tags, SQL filenames, snapshots, and runners are inconsistent.                                                                                                | Rewriting files/journal may destroy unknown deployed provenance.                                                | Preserve all historical artifacts; reconcile with forward-only and runner-integrity plan after DB inventory.                                                                                   |

No previous frozen architecture rule was changed by this report.

## 18. Blocker Register

| ID     | Severity      | Finding/evidence                                                                                             | Impact                                                                                               | Required decision                                                                                                           | Status                   |
| ------ | ------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| MIG-01 | Critical      | Three migration paths target different directories/ledgers; root route defaults to legacy IAM.               | Cannot identify the authoritative deployment path for module schemas.                                | Select canonical runner and migration directory, with transition policy.                                                    | OPEN                     |
| MIG-02 | Critical      | All five Drizzle journal tags lack matching SQL filenames; ORM reader requires `${tag}.sql`.                 | Drizzle `db:migrate` cannot read even first migration.                                               | Recover authoritative matching artifacts or approve a non-destructive forward history repair; do not rename/delete blindly. | OPEN                     |
| MIG-03 | Critical      | SQL-only and snapshot/DSL constraint drift, including credential UNIQUE.                                     | Generated changes may duplicate or omit deployed invariants.                                         | Decide schema desired-state reconciliation and verify catalogs across supported DBs.                                        | OPEN                     |
| MIG-04 | High          | `apply-migrations.js` catches each SQL error, continues, and prints success; has no transaction or journal.  | Partial schema can be reported as applied.                                                           | Retire or repair runner fail-closed after canonical-runner decision.                                                        | OPEN                     |
| MIG-05 | High          | Root runtime baseline path fingerprints existing schema when ledger empty and expected fingerprint supplied. | “Clean database from zero” support cannot be assumed for root command.                               | Decide fresh-install/bootstrap procedure and test it separately.                                                            | OPEN                     |
| MIG-06 | High          | Database catalog and migration table state not inspected.                                                    | Existing UNIQUE presence, duplicate data, runner ledger, and search path unknown.                    | Provide a dedicated non-production DB URL and catalog authorization for DB introspection.                                   | NOT VERIFIED             |
| TYP-01 | High          | `any` in context, UoW, DB factory, migration runtime.                                                        | Zero-any quality rule cannot pass at the existing boundary.                                          | Approve typed infra generic boundary without Application/Domain Drizzle leakage.                                            | OPEN                     |
| ERR-01 | Medium        | No `PasswordCredentialNotFoundError`.                                                                        | Application cannot distinguish credential-missing from other not-found without generic code/message. | Approve subtype under `PersistenceNotFoundError` or explicitly choose base type.                                            | PROPOSED                 |
| DEL-01 | Medium        | `delete(missing)` unspecified by port.                                                                       | Strict and idempotent callers have different observable semantics.                                   | Approve strict repository behavior or idempotent behavior.                                                                  | PROPOSED                 |
| APP-01 | Informational | No Application consumer found.                                                                               | No use-case-level coverage yet, but repository qualification does not require inventing one.         | None for this phase; disclose scope.                                                                                        | RESOLVED (not a blocker) |

No item is marked `FROZEN`.

## 19. Recommended Next Actions

1. Architecture owner selects the canonical production migration runner and directory. Explicitly decide whether root `MigrationRunner`, Drizzle Kit, or another controlled route owns new module schema deployment.
2. On a dedicated non-production database, inventory PostgreSQL constraints/indexes, migration ledgers, schemas/search path, applied hashes, and data duplicates. No DB inventory was performed here.
3. Recover provenance for journal/snapshot/SQL mismatches from source control/deployment artifacts. Preserve applied files and journal history; do not synthesize `0004` from a snapshot.
4. Fix the selected runner's integrity behavior: resolve journal/file parity, make statement failures fail the command, define transaction boundaries, and keep the database execution ledger unambiguous.
5. Reconcile Drizzle declarations and latest snapshot with verified desired constraints; preview generated SQL before applying. Add any corrections as forward-only migrations only after preflight and clean/upgraded DB tests.
6. Approve a typed `TransactionContext`/UoW database boundary compatible with the frozen `IUnitOfWork` and no-Drizzle Application boundary.
7. Freeze PasswordCredential error and delete contracts; only then implement its mapper/repository and run real PostgreSQL qualification through the chosen runner/test DB.

## 20. Contract Freeze Readiness

**NOT READY FOR FREEZE.** The two highest-impact unresolved items are migration authority/history integrity and the type-safe transaction boundary. Error subtype and delete behavior remain proposals pending approval. Application consumer absence is not a blocker.

## PostgreSQL Verification

`DATABASE_URL` was checked for presence only and is absent. Therefore all live database claims, constraint catalog inspection, duplicate-row checks, migration replay, clean-DB reproduction, and existing-DB compatibility are **NOT VERIFIED — DATABASE_URL unavailable**. No database URL value was printed or used.

## Code Change Record

No source, schema, migration SQL, snapshot, journal, test, or existing architecture rule was changed. This report is a new documentation artifact only.
