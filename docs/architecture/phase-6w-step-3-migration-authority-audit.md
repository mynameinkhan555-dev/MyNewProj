# Phase 6W Step 3 — Migration Authority Audit

**Audit date:** 2026-10-01  
**Mode:** Read-only local source/config/history inspection. No migrations, Cloud queries, DDL, schema changes, SQL generation, or data mutations were run.  
**Cloud context:** The prior [read-only Cloud audit](phase-6w-step-3-cloud-postgresql-audit.md) recorded the configured Supabase endpoint as reachable, with 0/13 expected application tables and no project migration ledger. This audit did not reconnect to Cloud.

Evidence labels: **VERIFIED** means directly present in inspected source/config/artifacts or in the referenced prior Cloud audit. **INFERENCE** means plausible but not directly observed. **NOT VERIFIED** means no execution/runtime evidence was collected here.

## 1. Executive Summary

**Migration authority is UNRESOLVED; this is a MIGRATION AUTHORITY CONFLICT.** Three independent migration executors plus one direct schema-push route exist for `DATABASE_URL`:

1. Root `pnpm db:migrate` routes to the custom `@workspace/migration-runtime`, whose default directory is the legacy IAM chain. It is labelled a production migration CLI, but its normal path is baseline/fingerprint-oriented and is not the platform 13-table chain.
2. Platform `drizzle-kit migrate` uses `packages/platform-database/migrations` and Drizzle’s journal/DB ledger. It cannot currently read the first migration because every journal tag lacks a matching `<tag>.sql` file.
3. Platform `db:apply-migrations` scans the same SQL directory but ignores journal/history, does not wrap the chain in a transaction, suppresses each statement error, then reports success.

`drizzle-kit generate` reads one platform schema barrel and three module-owned schema barrels. The platform directory contains four domain-named SQL files, five Drizzle journal entries, and five linked snapshots. All five SQL filenames fail exact journal-tag matching; all four present SQL files are unjournaled by exact name. The snapshots’ `prevId` chain is continuous, but the idx 3 snapshot adds no tables and idx 4 adds outbox tables while the only outbox SQL file is named `0003_outbox.sql`.

The legacy IAM chain contains 13 SQL files `0001`–`0013`, but models a different schema (`identities`, `iam_*`, text IDs, legacy sessions) from the expected Identity/tenant/access-control schema. It also contains `ON DELETE CASCADE` policies and numbered-historical behavior. Current root `db:migrate` with default fingerprint configuration and an empty execution ledger selects baseline verification, not migration-from-zero; the baseline artifact is `0012`. **It is not the platform schema bootstrap path.**

**Current chain reproducibility for the expected 13-table platform schema: RED.** **Cloud migration gate: BLOCKED.** Do not run any migration or select a winning authority from preference; architecture-owner decisions are required.

## 2. Current Migration Architecture

There are two migration directories, three migration executors, and one additional direct schema-push mutator:

- `modules/iam/src/infrastructure/database/migrations`: 13 legacy SQL files, `0001_initial.sql` through `0013_magic_link_tokens.sql`; no Drizzle journal/snapshots there. Root custom runner reads this directory by default.
- `packages/platform-database/migrations`: four platform/module SQL files (`0000_identity.sql`–`0003_outbox.sql`), a Drizzle `_journal.json` with five entries, and snapshots `0000`–`0004`.
- `scripts/expected-fingerprint.json`: baseline identity `0012`, SHA-256 fingerprint of the legacy IAM schema.

The expected 13 tables belong to the platform/module schema and are represented in `packages/platform-database/drizzle.config.ts` inputs, not in the root runner’s default IAM migration directory. Both directories use unqualified/public application DDL and consume the generic `DATABASE_URL`; both can therefore be pointed at the same PostgreSQL database, though their table models conflict (notably `tenants` and `tenant_roles`).

## 3. Migration Mechanisms Inventory

| Mechanism                       | Location                                                                                    | Reads                                                                             | Writes / mutates                                                                   | Authority?                                                                | Notes                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root `pnpm db:migrate`          | Root `package.json` → `scripts/package.json` → `scripts/src/migrate.ts` → `MigrationRunner` | Legacy IAM SQL directory, expected fingerprint, DB `__drizzle_migrations` entries | Creates the custom history table, executes legacy SQL or baseline-journals history | **Configured root command; not established as sole production authority** | CLI source calls itself production migration CLI; deployment/CI does not invoke root `db:migrate` in inspected files.                                 |
| Root `pnpm db:migrate:baseline` | Root package → scripts package → same `migrate.ts --baseline`                               | Same as root command                                                              | Same runner behavior                                                               | No separate authority                                                     | `migrate.ts` does not inspect `process.argv`; `--baseline` itself is not parsed. Baseline selection is based on empty ledger plus loaded fingerprint. |
| `drizzle-kit generate`          | `packages/platform-database/package.json`, `drizzle.config.ts`                              | Four Drizzle schema barrels plus previous snapshot                                | Writes SQL, journal entry and snapshot                                             | **Schema generation path only**                                           | Generation is not execution. Metadata includes generated name, current timestamp, and snapshot UUID.                                                  |
| Platform `drizzle-kit migrate`  | Platform package script → Drizzle ORM migrator                                              | `_journal.json`, `${tag}.sql`, Drizzle ledger in `drizzle.__drizzle_migrations`   | Creates `drizzle` schema/ledger and applies pending SQL transactionally            | **Configured alternative; currently blocked by artifact mismatch**        | Installed ORM reader throws on missing SQL for journal idx 0 before executing migrations.                                                             |
| Platform `drizzle-kit push`     | Platform package script/config                                                              | Current Drizzle schema and target database                                        | Directly changes database schema                                                   | **Separate mutation route; not migration-history authority**              | Not run; bypasses reviewed SQL migration chain. Prohibited for production by required contract.                                                       |
| Platform SQL-glob runner        | `packages/platform-database/scripts/apply-migrations.js`                                    | All `*.sql` files sorted lexically                                                | Executes SQL statements directly                                                   | **Competing mutation route; unsafe for promotion**                        | No journal/history, chain transaction, advisory lock, or fail-closed per-statement behavior.                                                          |
| Migration history validator     | `scripts/validate-baseline-fingerprint.ts`, CI workflow                                     | Legacy IAM migrations, committed fingerprint, disposable DB                       | Contains `DROP DATABASE`/`CREATE DATABASE`, applies migrations in a test DB        | Validation harness only                                                   | CI config supplies a local PostgreSQL service URL. Never point this script at production/Cloud.                                                       |
| Fresh reproduction harness      | `scripts/test-fresh-reproduction.ts`                                                        | Hard-coded legacy IAM 0001–0012, local DB names                                   | Contains `DROP DATABASE` and `CREATE DATABASE`; applies to two DBs                 | Test harness only                                                         | Not invoked during this audit; no pass result asserted.                                                                                               |
| CI migration guardrail          | `.github/workflows/ci.yml` references `scripts/ci-migration-guardrail.ts`                   | Intended IAM directory                                                            | Unknown; referenced file is absent in this workspace                               | **NOT AVAILABLE**                                                         | Exact path lookup found no such file; CI step is not backed by a source file here.                                                                    |

No `turbo.json`/`nx.json` was found. CI uses a local PostgreSQL 17 service, calls the missing migration guardrail path and baseline fingerprint validator, and does not call a migration command. No Docker/Kubernetes migration job invoking these scripts was found in inspected deployment files. External deployment pipeline behavior is **NOT VERIFIED**.

## 4. Root `pnpm db:migrate` Execution Trace

```text
root package.json: db:migrate
  → pnpm --filter @workspace/scripts migrate
  → scripts/package.json: tsx ./src/migrate.ts
  → scripts/src/migrate.ts
  → new MigrationRunner({ databaseUrl, migrationDirectory, expectedFingerprint })
  → modules/iam/src/infrastructure/database/migrations by default
  → MigrationRunner.run()
```

Detailed behavior:

1. `migrate.ts` calls dotenv config, reads `DATABASE_URL`, sets `MIGRATION_DIRECTORY` to the legacy IAM folder unless overridden, loads `scripts/expected-fingerprint.json` unless `SKIP_FINGERPRINT=true`, and passes that fingerprint to the runner.
2. Runner creates `__drizzle_migrations` before acquiring a session advisory lock with fixed key `5432100001`.
3. Runner discovers `.sql` files, derives IDs from filenames, hashes full contents with SHA-256, classifies SQL, and sorts lexically by migration ID.
4. If its DB ledger is empty and an expected fingerprint exists, it enters baseline mode. It introspects the current DB and compares its normalized schema fingerprint. If it matches, it records historical files with IDs `<=0012` in the ledger **without executing them**. If it does not match, it returns failure. Thus default clean database behavior is baseline verification, not fresh bootstrap.
5. Otherwise normal mode checks each already-journaled entry has a file and rejects hash mismatch, then executes pending files.
6. IDs `<=0012` run through the advisory-lock client and are journaled after the SQL query. The runner itself does not add a transaction around these historical files; the existing files generally contain their own `BEGIN`/`COMMIT` (0002 and 0003 are empty). On SQL failure it does not issue an explicit rollback for this historical path before unwinding.
7. Future `Atomic` migrations run SQL and ledger insertion together inside `PostgresDatabase.transaction()`; that wrapper performs `BEGIN`, `COMMIT`, and rollback on thrown failure. Empty future files are only journaled.
8. `MigrationClassifier` calls SQL `Legacy` when it sees both `BEGIN` and `COMMIT`, `Empty` for empty SQL, otherwise `Atomic`. **There is no `MigrationType.Legacy` branch in `executeMigration()` for future IDs.** A future explicitly transactional migration would fall through, log “Migration completed”, and not execute or journal. Current `0013_magic_link_tokens.sql` has no explicit `BEGIN`/`COMMIT`, so classifier would call it `Atomic`; this is static classification, not a migration run.
9. Normal failure propagates to `run()`, which logs and returns `{success:false}`; CLI exits 1. On success CLI reports mode and migrations executed. Baseline mode reports the number of historical entries journaled as `migrationsExecuted` even though no SQL ran, so that label is semantically ambiguous.
10. `db:migrate:baseline` appends `--baseline`, but `migrate.ts` does not parse argv. Empty-ledger + expected-fingerprint logic—not that CLI flag—determines baseline mode.

## 5. Drizzle Generation Trace

`packages/platform-database/drizzle.config.ts` is the configured generation input:

```text
./src/schema/index.ts
../../modules/identity/infrastructure/persistence/drizzle/schema/index.ts
../../modules/tenant/infrastructure/persistence/drizzle/schema/index.ts
../../modules/access-control/infrastructure/persistence/drizzle/schema/index.ts
        ↓
Drizzle Kit generate
        ↓
packages/platform-database/migrations
    ├── SQL files
    └── meta/_journal.json + numbered snapshots
```

The platform barrel exports `outbox_events` and `event_consumption`. Together with the three module barrels, this represents platform/outbox + Identity + Tenant + Access Control, i.e. the intended 13 application tables. No glob, `migrationsSchema`, or `migrationsTable` override is configured; dialect is PostgreSQL and connection uses `process.env.DATABASE_URL`.

Resolved package metadata inspected locally: platform package declares `drizzle-kit ^0.22.8` and `drizzle-orm ^0.33.0`; installed package metadata reports Kit 0.22.8 and ORM 0.33.0. The generator writes a snapshot, journal entry, and `${tag}.sql` together. It creates sequential numeric prefixes, but the default tag suffix uses random adjective/hero words, snapshot IDs use `randomUUID()`, and journal `when` uses the current time. Thus generation metadata and filenames are **not byte-for-byte/deterministically reproducible** without supplied naming and fixed generated metadata. SQL statement ordering was not regenerated or compared by executing Kit.

Drizzle migration ledger defaults in the resolved ORM are schema `drizzle`, table `__drizzle_migrations`; it stores SQL hash and folder timestamp. Its reader loads each journal tag’s exact `${tag}.sql` path and fails if missing. Its dialect wraps pending migration application/ledger insertion in a DB transaction, after creating schema/table and reading the latest timestamp. It does not establish the custom runner’s advisory-lock/hash-history semantics.

## 6. Migration Chain Integrity

### Platform/Drizzle chain

| idx/order | Journal tag                | Exact SQL file                 | Snapshot             | `prevId`         | Exists / consistent                             |
| --------: | -------------------------- | ------------------------------ | -------------------- | ---------------- | ----------------------------------------------- |
|         0 | `0000_open_avengers`       | `0000_open_avengers.sql`       | `0000_snapshot.json` | zero UUID        | Snapshot yes; SQL no; journal/file inconsistent |
|         1 | `0001_thin_wilson_fisk`    | `0001_thin_wilson_fisk.sql`    | `0001_snapshot.json` | 0000 snapshot id | Snapshot yes; SQL no; journal/file inconsistent |
|         2 | `0002_little_hedge_knight` | `0002_little_hedge_knight.sql` | `0002_snapshot.json` | 0001 snapshot id | Snapshot yes; SQL no; journal/file inconsistent |
|         3 | `0003_abandoned_fenris`    | `0003_abandoned_fenris.sql`    | `0003_snapshot.json` | 0002 snapshot id | Snapshot yes; SQL no; journal/file inconsistent |
|         4 | `0004_talented_rhodey`     | `0004_talented_rhodey.sql`     | `0004_snapshot.json` | 0003 snapshot id | Snapshot yes; SQL no; journal/file inconsistent |

The journal `when` timestamps are ascending from 2026-09-30 13:49:05Z to 14:14:46Z. Snapshot `id`→`prevId` links are continuous through 0004. No duplicate journal indices/tags were found. There are **four orphan SQL files by exact journal tag**: `0000_identity.sql`, `0001_tenant.sql`, `0002_authorization.sql`, `0003_outbox.sql`. There are **five journal entries with missing matching SQL**, and five snapshots with matching numeric index but not matching runnable migration filename. The idx-3 snapshot remains at 11 tables; idx-4 snapshot adds the two outbox tables (13 total), while the only outbox SQL file is numbered `0003_outbox.sql`. This is an ordering/identity mismatch, not a broken `prevId` UUID chain.

### Legacy IAM chain

The legacy directory has 13 lexically contiguous SQL files `0001_initial.sql`–`0013_magic_link_tokens.sql`; there is no 0000 file, no Drizzle journal, and no snapshots in that directory. 0002 and 0003 are zero-byte SQL files; 0001–0012 are treated by the custom runtime as historical, and 0013 is the first future migration. The root custom DB ledger is the only history mechanism for this chain.

The root ledger stores `name`, hash, created_at; hashes are SHA-256 of complete SQL content. Journal schema does not declare a unique constraint on migration `name`. Runtime normal mode checks journaled names exist on disk and checks hashes for same-named files, but does not validate contiguous numeric prefixes or reject duplicate history names before choosing the first match.

## 7. Journal / SQL / Snapshot Reconciliation

| Artifact relationship                          | Result                                                                                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drizzle journal entry → exact SQL filename     | All five missing.                                                                                                                                                     |
| Platform SQL file → exact journal entry        | All four missing.                                                                                                                                                     |
| Drizzle journal entry → numeric snapshot       | Five snapshots exist at matching numeric index.                                                                                                                       |
| Snapshot `prevId` chain                        | Continuous; no broken parent ID found.                                                                                                                                |
| Platform SQL file → snapshot by numeric intent | 0000–0002 align conceptually by subject; outbox SQL is `0003_outbox.sql`, while outbox structures first appear in 0004 snapshot. Exact provenance is not established. |
| Legacy IAM SQL → Drizzle journal/snapshot      | No journal/snapshots in that directory. Uses DB custom ledger, not Drizzle metadata.                                                                                  |
| Applied Cloud migration record                 | Prior read-only Cloud audit reports no project ledger; not queried again for this local audit.                                                                        |
| Orphan/extra files                             | Four platform SQL files are unjournaled by exact tag; no tagged SQL exists. No duplicate numeric SQL names within either directory.                                   |

**INFERENCE:** The suffix mismatch and outbox offset may reflect manually renamed/generated artifacts, removed SQL, or different generation history. The repository does not establish which cause occurred. Do not synthesize a missing `0004` migration from a snapshot.

## 8. Drizzle Schema ↔ Migration SQL Drift

Recalculated from current module schema files and platform SQL. This is not a live database comparison; the prior Cloud audit says the application tables are absent there.

| Object/invariant                                        | Drizzle declaration                                                                      | Platform SQL                      | Snapshot                                                                                                                                             | Finding                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `users.status` CHECK                                    | No                                                                                       | `chk_users_status`                | No                                                                                                                                                   | SQL-only.                                               |
| `password_credentials.user_id` UNIQUE                   | No (comment says manually added)                                                         | `uq_password_credentials_user_id` | No in 0000–0004                                                                                                                                      | Critical SQL-only invariant.                            |
| `email_identities(user_id) WHERE primary=true` UNIQUE   | No                                                                                       | Partial unique index              | No                                                                                                                                                   | SQL-only.                                               |
| `external_identities(provider,provider_subject)` UNIQUE | No                                                                                       | Unique index                      | No                                                                                                                                                   | SQL-only.                                               |
| `external_identities.user_id` index                     | No                                                                                       | Normal index                      | No                                                                                                                                                   | SQL-only.                                               |
| Tenant `tenants.status` CHECK                           | No                                                                                       | `chk_tenants_status`              | No                                                                                                                                                   | SQL-only.                                               |
| Membership user/tenant indexes                          | No                                                                                       | Two normal indexes                | No                                                                                                                                                   | SQL-only.                                               |
| Active membership pair UNIQUE                           | No                                                                                       | Partial unique index              | No                                                                                                                                                   | SQL-only.                                               |
| `permissions.key` UNIQUE + two CHECKs                   | Yes                                                                                      | Yes                               | Latest snapshot omits                                                                                                                                | Snapshot drift.                                         |
| `tenant_roles(tenant_id,key)` UNIQUE + status CHECK     | Yes                                                                                      | Yes                               | Latest snapshot omits                                                                                                                                | Snapshot drift.                                         |
| Role assignment status CHECK                            | Yes                                                                                      | Yes                               | Snapshot omits                                                                                                                                       | Snapshot drift.                                         |
| Active role assignment pair UNIQUE + two indexes        | No                                                                                       | Partial unique + normal indexes   | No                                                                                                                                                   | SQL-only.                                               |
| RolePermission composite PK                             | No (table DSL declares only two FKs + created_at)                                        | `pk_role_permissions`             | No                                                                                                                                                   | SQL-only; ORM inferred table has no composite key.      |
| RolePermission two indexes                              | No                                                                                       | Yes                               | No                                                                                                                                                   | SQL-only.                                               |
| Event-consumption composite PK                          | No (DSL comment only)                                                                    | Composite PK                      | Snapshot has no composite PK                                                                                                                         | SQL-only.                                               |
| Event-consumption event FK                              | No in table DSL                                                                          | RESTRICT FK                       | Snapshot has no FK                                                                                                                                   | SQL-only.                                               |
| Outbox CHECKs                                           | Yes                                                                                      | Yes                               | Snapshot contains table, constraint metadata needs exact reconciliation; latest snapshot output did not record checks in the expected `checks` field | Verify snapshot format/contents before claiming parity. |
| Outbox dispatcher indexes                               | Comment says manually added; DSL lacks index callbacks                                   | Three indexes incl. retry partial | Snapshot indexes empty                                                                                                                               | SQL-only.                                               |
| Inline declared FKs                                     | Module DSL uses RESTRICT                                                                 | SQL uses RESTRICT                 | Snapshots generally record FKs                                                                                                                       | Core delete action aligns where represented.            |
| Defaults                                                | Email primary and outbox timestamps/attempts have DSL defaults; SQL defaults are present | Present for listed columns        | Snapshot contains defaults for serialized declared defaults                                                                                          | Review exact all-column parity before generation.       |

The module SQL is not a single clean output of current DSL/snapshot: migration 0000 includes constraints manually absent from DSL, and `0004_snapshot` includes schema DSL declarations absent from snapshots 0002/0003. Re-running generation could propose changes, but exact output was not generated here.

## 9. Migration Runner Reliability Audit

### Custom root `MigrationRunner`

| Concern                 | Evidence-based behavior                                                                                                        | Risk / required protection                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Locking                 | Session advisory lock on dedicated client, fixed key; acquired after ensuring ledger table.                                    | Only this runner uses this lock. All other platform mutation routes can bypass it. Freeze one authority and lock contract.                                                                                                           |
| Migration ordering      | Lexical sort by filename-derived ID.                                                                                           | No contiguous numbering, duplicate prefix, or cross-directory authority validation. Add integrity checks before execution.                                                                                                           |
| Integrity               | SHA-256 full-file hash; fails on hash mismatch for journaled same name; fails if journaled migration file missing.             | Does not protect another runner’s ledger or detect schema drift except baseline fingerprint mode.                                                                                                                                    |
| Atomic future migration | For IDs >0012 classified `Atomic`, SQL and ledger insert share `PostgresDatabase.transaction()`.                               | Good atomic property for that branch, but a future `Legacy` type has no branch and silently falls through. Reject unsupported type before execution and test it.                                                                     |
| Historical migration    | IDs <=0012 execute directly using lock client; SQL files mostly carry explicit BEGIN/COMMIT. Ledger insert follows separately. | SQL-success/ledger-failure leaves applied-but-unrecorded schema; retry may fail. On SQL failure, runner has no explicit rollback in this branch. Wrap/validate historical execution and test crash/failure windows before promotion. |
| Ledger failure          | Historical SQL and later ledger insert are not in one runtime transaction. Atomic future branch couples them.                  | Failure can split history from schema for historical files. Required: verified atomicity or documented recoverable two-phase strategy.                                                                                               |
| `Legacy` future type    | Classifier can return `Legacy`; `executeMigration` handles historical, Atomic, Empty only.                                     | A future ID with BEGIN+COMMIT is logged completed without SQL execution or ledger insertion. Current 0013 is classified Atomic; the bug is reachable for future migration input.                                                     |
| Empty future migration  | Inserts history only.                                                                                                          | Explicit no-op record is possible; report as intentional only with contract/test.                                                                                                                                                    |
| Lock release            | Explicit advisory unlock then release; outer pool close in finally.                                                            | If unlock query throws, release call is after the query and may not execute; ensure release in finally and test lock recovery.                                                                                                       |
| Baseline                | Fingerprints current catalog, then records IDs <=0012 without applying SQL.                                                    | Baseline is adoption/verification, not bootstrap. It returns historical count as `migrationsExecuted` despite SQL not executed. Make result semantics unambiguous.                                                                   |
| Error/reporting         | `run()` returns failure result; CLI exits nonzero.                                                                             | No static proof of process behavior under lock release/query failure; test.                                                                                                                                                          |
| Retry/crash recovery    | Ledger+hash permits skip/retry, but historical SQL-before-ledger gap and transaction-owning legacy SQL create partial states.  | Define recovery protocol and test process interruption around execution/ledger writes.                                                                                                                                               |
| Dry run                 | No dry-run mode found in runner config/entrypoint.                                                                             | Require explicit plan/preview mode before production release.                                                                                                                                                                        |

### Platform SQL-glob runner

It sorts files, splits on Drizzle breakpoints, executes each statement separately through `sql.unsafe`, catches and logs per-statement errors, continues, and prints “All migrations applied successfully.” It has no enclosing transaction, advisory lock, DB migration history, checksum, or completion marker. It can produce partial schema and success output. Re-running may skip `IF NOT EXISTS` statements while failing to repair constraints omitted by existing tables. This runner is **not safe for production migration**.

### Drizzle migration runner

ORM first requires `_journal.json` and every tag-matching SQL file. Current chain fails during file loading at idx 0. If repaired, ORM creates `drizzle.__drizzle_migrations` outside the pending migration transaction, uses last `created_at` to select pending migrations, and runs pending SQL+hash ledger inserts in a transaction. It does not take the custom runner’s advisory lock or compare all historical applied hashes against files. Do not conflate its ledger with the root custom `__drizzle_migrations` table; their schemas differ (Drizzle has hash/time, custom has hash/time/name and is unqualified).

## 10. Migration Authority Conflict Analysis

**Classification: MIGRATION AUTHORITY CONFLICT.** Evidence:

- Root command is wired to the custom legacy IAM runner and can mutate the target DB.
- Platform Drizzle migrate is separately exposed and, after artifact repair, can mutate the same `DATABASE_URL` target.
- Platform SQL-glob runner is separately exposed and can mutate the same target now, despite its unsafe failure semantics.
- `db:push` is another direct schema mutator.
- No CI/deployment invocation selects one of these as the production migration authority. CI only has a local database and references guardrail/fingerprint validation.

The families have overlapping object names including `tenants` and `tenant_roles`, but materially different types and contracts. Legacy starts with `identities`/`iam_*`, text IDs, old `iam_sessions`, cascade relationships and legacy tables. Platform SQL starts with `users`, `email_identities`, `sessions`, UUID IDs, tenant/membership and access-control tables with RESTRICT relations. Applying both to one `public` schema risks `CREATE TABLE IF NOT EXISTS` silently preserving the first table’s incompatible definition, followed by later indexes/FKs operating on the wrong shape.

**Required decision:** architecture owner must choose one canonical production authority, directory, ledger, transaction/locking policy, and transition/adoption strategy. This audit does not select a winner.

## 11. Empty Database Reproducibility

**Overall expected platform 13-table chain: RED.** The configured Drizzle migrator cannot load SQL from current tags. The SQL-glob runner can see four files in dependency order (identity → tenant → authorization → outbox), with no declared extensions/functions/triggers found, but suppresses statement failures, has no history ledger, and has no whole-chain transaction; therefore it cannot prove reproducible state or reliably fail. Not GREEN.

**Root `pnpm db:migrate` default: RED for a truly empty database.** With default fingerprint loading and empty ledger it enters baseline mode, fingerprints the database against the committed legacy `0012` baseline, and does not execute migrations. Empty schema cannot equal the populated legacy fingerprint; static evidence predicts failure. `SKIP_FINGERPRINT=true` routes to normal migration execution, but that applies legacy IAM—not the expected 13-table platform chain.

**Legacy IAM 0001–0012: YELLOW, static only.** Files are ordered and mostly explicit per-file transactions; 0002/0003 are empty. CI contains a validator that applies these migrations to a disposable database and compares a fingerprint, and a separate fresh-reproduction script applies them twice. Neither was run in this audit, and no result artifact was inspected. The root default still does not bootstrap from empty. Migration 0013 is beyond the baseline and not included in those 0001–0012 fresh reproduction arrays.

No migration execution, introspection of an empty local database, or test harness was run here. No PostgreSQL extensions, custom functions, or triggers were found in migration SQL. `gen_random_uuid()` is used in legacy 0013; PostgreSQL 17 provides it, but deployment compatibility to older server versions is not established here.

## 12. Cloud Migration Gate

```text
CLOUD MIGRATION GATE: BLOCKED
```

Reasons: conflicting mutation authorities; broken Drizzle journal-to-file mapping; root default is baseline verification not bootstrap; unsafe SQL-glob runner can report success after partial failure; schema/SQL/snapshot drift; Cloud was previously observed at 0/13 tables/no project ledger; target identity was not independently matched to the intended dashboard project. No migration was run in this audit.

## 13. Enterprise Migration Contract

Before first Cloud migration, the selected authority must provide evidence for each item:

1. Exactly one migration executor is approved for production; alternatives are disabled or guarded against production targets.
2. One canonical migration directory owns all production SQL.
3. One documented DB execution ledger owns applied names/identities, timestamps, and hashes; collision with any other runner’s ledger is prohibited.
4. Ordering is deterministic and validated (unique identities, valid sequence, dependency order, no missing required predecessors).
5. Each migration and its history record commit atomically, or an explicit, tested recoverable protocol covers non-transactional operations.
6. Any SQL failure fails the command; no continue-and-report-success behavior.
7. Distributed/advisory lock is acquired before migrations and reliably released on all failure paths.
8. Applied-file hash/fingerprint drift is checked fail-closed; schema baseline adoption is a separate explicit mode.
9. Crash windows before/after DDL and ledger write have tested recovery instructions.
10. Idempotency is defined per migration; rerunning is not used as a substitute for tracking partial application.
11. Production changes roll forward; destructive down migrations are not assumed.
12. Verified backup/PITR status and restore procedure are prerequisites for production DDL.
13. CI validates chain/journal/snapshot/schema consistency and runs migration tests on disposable PostgreSQL.
14. Clean database rebuild from the exact committed chain is tested and evidenced.
15. Upgrade from a representative prior schema and a shadow-database rehearsal are tested.
16. Production gate checks target project/database identity, approval, lock, backup, and exact migration plan before execution.
17. Post-migration Cloud catalog verification checks expected tables, columns, constraints, indexes, and ledger; no business rows need be read.
18. Every run records target identity, artifact hashes, runner/version, applied migration IDs, outcome, and operator approval without logging credentials.
19. `drizzle-kit push` is prohibited against production; production changes use the approved reviewed migration chain only.
20. No ad-hoc SQL path may mutate production outside the chosen authority; emergency SQL must be versioned and recorded through the same governance.

## 14. Required Decisions

1. Is the Phase 6 schema/migration authority Drizzle Kit or the existing fingerprint-aware IAM `MigrationRunner`? The current code does not reconcile them.
2. Which database lineage is intended for the 13-table Cloud schema: legacy IAM, platform Drizzle, or an explicitly approved transition? Do not mix them by running both.
3. How should platform journal tags, four SQL filenames, and five snapshots be reconciled while preserving any applied history? Cloud audit says no project ledger on that endpoint, but other environments remain unknown.
4. Should root fresh-install have a dedicated bootstrap route separate from baseline adoption? Current `db:migrate` default is not empty-DB bootstrap.
5. Should the referenced missing CI guardrail file be restored or the CI invocation changed? No change made here.
6. How will the custom runner handle future `Legacy` classifications, SQL/ledger atomicity, lock-release failures, and baseline result naming?
7. Is the `DATABASE_URL` target identity confirmed and the duplicate `.env` key resolved before any mutation? This audit did not alter `.env`.
8. What verified backup/restore and shadow rehearsal are mandatory for the first Cloud deployment?

## 15. Blockers

| ID        | Severity | Blocker                                                                                                                               | Evidence                                                                               | Status       |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------ |
| AUTH-01   | Critical | Multiple independent production-capable mutation paths; no deployment authority selected.                                             | Root script, Drizzle package scripts, SQL-glob runner, push script.                    | OPEN         |
| CHAIN-01  | Critical | Every Drizzle journal tag lacks matching SQL; all four actual platform SQL files are exact-name orphaned.                             | Journal and migration directory inventory; installed ORM reader requires tag filename. | OPEN         |
| CHAIN-02  | Critical | Latest outbox snapshot is idx 4 while only outbox SQL is numbered 0003; idx 3 snapshot has 11 tables.                                 | Snapshot contents, journal, SQL files.                                                 | OPEN         |
| RUN-01    | Critical | SQL-glob runner swallows statement failures and claims success, no ledger/transaction/lock.                                           | `apply-migrations.js`.                                                                 | OPEN         |
| RUN-02    | High     | Root default on empty ledger enters fingerprint baseline and does not execute SQL; `--baseline` is not parsed.                        | `migrate.ts`, `MigrationRunner.run()`/`runBaseline()`.                                 | OPEN         |
| RUN-03    | High     | Future `Legacy` classification has no execute/journal branch and can log completion as no-op.                                         | Classifier + `executeMigration()`.                                                     | OPEN         |
| RUN-04    | High     | Historical SQL and ledger write are separate; no runner rollback for historical failure; lock release can fail before client release. | `executeMigration()` and lock release callback.                                        | OPEN         |
| SCHEMA-01 | High     | Drizzle DSL, SQL and snapshots drift, including unique/check/partial/composite constraints.                                           | Identity/tenant/access/platform schema, four SQL files, snapshots.                     | OPEN         |
| CI-01     | High     | CI references `scripts/ci-migration-guardrail.ts`, absent in workspace.                                                               | Workflow line 93; exact file lookup absent.                                            | OPEN         |
| CI-02     | High     | Baseline validator includes DROP/CREATE database statements using `DATABASE_URL`-derived admin connection.                            | `validate-baseline-fingerprint.ts`; safe only with isolated CI service URL.            | OPEN         |
| CLOUD-01  | High     | Prior Cloud audit saw 0/13 expected tables/no project ledger; dashboard identity was not independently confirmed.                     | [Cloud audit](phase-6w-step-3-cloud-postgresql-audit.md).                              | BLOCKED      |
| REPRO-01  | High     | No migration/test command was run in this audit; fresh reproduction source exists but has no result evidence here.                    | Task safety constraint and scripts.                                                    | NOT VERIFIED |

No blocker was modified or marked resolved.

## 16. Evidence

Files inspected include:

- Root `package.json`, `pnpm-workspace.yaml`, `scripts/package.json`, `packages/platform-database/package.json`, `modules/identity/package.json`.
- `packages/platform-database/drizzle.config.ts` and platform `db:generate`, `db:migrate`, `db:push`, `db:apply-migrations` scripts.
- Root `scripts/src/migrate.ts`, `packages/migration-runtime/src/{runner,journal,classifier}.ts`, and `packages/platform-database/src/database.ts`.
- Platform `apply-migrations.js`, SQL files 0000–0003, `_journal.json`, snapshots 0000–0004.
- Legacy IAM SQL files 0001–0013, expected fingerprint artifact, baseline validator, fresh reproduction script.
- CI workflow and deployment migration command references.
- Identity, tenant, access-control and platform/outbox Drizzle schemas.
- Installed Drizzle Kit 0.22.8 generator and Drizzle ORM 0.33.0 migration reader/dialect implementation.
- Prior read-only Cloud audit report; no Cloud connection/query was made in this audit.

**Commands/actions executed:** read-only file searches/reads and PowerShell static enumeration/regex parsing of file names, SQL text markers, journal and snapshots; `pnpm exec prettier --check docs/architecture/phase-6w-step-3-migration-authority-audit.md` completed successfully. No `pnpm db:*`, Drizzle migration/push/generate, runner, test harness, or Cloud command was executed.

## 17. No-Change Guarantee

Only this audit report is permitted to change. No source code, schema, SQL migration, journal, snapshot, package script, `.env`, or database was changed by this audit. No migration/schema/data mutation was executed. Existing worktree changes were not staged, reverted, or otherwise altered.
