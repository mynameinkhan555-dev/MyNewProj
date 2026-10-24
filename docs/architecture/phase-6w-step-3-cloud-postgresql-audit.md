# Phase 6W Step 3 — Cloud PostgreSQL Audit

Audit date: 2026-10-01  
Scope: metadata-only Supabase PostgreSQL inspection, local migration/config comparison, and contract readiness. No business rows were selected.

**Safety record:** Loaded `DATABASE_URL` through the existing root `.env`/dotenv mechanism without displaying it. Opened PostgreSQL transactions and issued `SET TRANSACTION READ ONLY`; all subsequent database statements were catalog or information-schema `SELECT`s. No migration, push, DDL, insert, update, delete, event publish, or business-row query was run.

Evidence labels used throughout: **VERIFIED** = directly observed in repository files or live PostgreSQL metadata; **INFERENCE** = reasoned possibility, not observed state; **NOT VERIFIED** = unavailable or deliberately not inspected.

## 1. Executive Summary

**Cloud PostgreSQL connection: CONNECTED.** The live database is PostgreSQL 17.11. `current_database()` returned `postgres`, current schema is `public`, search path is `"$user", public, extensions`. The safely parsed pooler host is `aws-0-ap-northeast-2.pooler.supabase.com`; the URL-derived Supabase project reference is `dovogoonhvpqmjijsihc`. The complete connection string, password, username, server address, and service keys are not recorded. The project reference was derived from the pooler username convention and was not independently matched against Supabase project settings/API.

The project expects 13 application tables in `public`; **0/13 exist there**, and none of those table names exists in another non-system schema. There are no public unexpected base tables. Supabase-managed relations exist in `auth`, `realtime`, `storage`, and other service schemas; these were not treated as application tables and their business/service data was not read.

No project `__drizzle_migrations` ledger was found in any non-system schema. The expected identity, tenant, authorization, and outbox structures therefore cannot be physically verified in this database. The cloud database is **INCOMPATIBLE with the frozen application persistence schema in its current observed state** because all 13 required relations are absent; this says nothing about any other project database.

**Overall: CONTRACT STILL BLOCKED.** Do not implement PasswordCredentialRepository or apply migrations on this database until its intended role is confirmed and migration authority/history is resolved.

## 2. Connection Result

| Check                  | Result                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` source  | Root `.env`, loaded in-process through `dotenv`; value not displayed.                                            |
| TLS                    | Client configured with `ssl: 'require'`.                                                                         |
| PostgreSQL connection  | CONNECTED.                                                                                                       |
| Transaction mode       | `SET TRANSACTION READ ONLY` succeeded before metadata queries.                                                   |
| Server                 | PostgreSQL 17.11, x86_64, 64-bit.                                                                                |
| Database name          | `postgres`.                                                                                                      |
| Current schema         | `public`.                                                                                                        |
| Search path            | `"$user", public, extensions`.                                                                                   |
| Pooler hostname        | `aws-0-ap-northeast-2.pooler.supabase.com`.                                                                      |
| URL port               | `6543` (Supabase shared transaction-mode pooler endpoint).                                                       |
| PostgreSQL server port | `5432` as returned inside the connected server session.                                                          |
| SSL                    | Audit client required TLS (`ssl: 'require'`); connection succeeded. The URL has no explicit `sslmode` parameter. |
| Effective DB role      | `postgres` (reported role is not a credential).                                                                  |
| Supabase project ref   | `dovogoonhvpqmjijsihc`, derived from the URL username pattern; not externally verified.                          |

**VERIFIED:** The connection was live and returned server/catalog metadata; the pooler host, database, port, and URL-derived project reference were parsed without revealing the password or complete URL. **NOT VERIFIED:** whether this is the intended production database or whether the project reference matches the user's intended Supabase dashboard project.

## 3. Cloud Database Identity

The configured database exposes Supabase-managed schemas and relations including `auth`, `realtime`, `storage`, `vault`, `graphql`, and `extensions`. This is consistent with a Supabase-managed PostgreSQL instance. The URL-derived reference is `dovogoonhvpqmjijsihc` and the pooler hostname indicates the `ap-northeast-2` pooler region. These values identify the configured endpoint target but do not prove it is the project the user intended; no Supabase control-plane lookup was performed.

## 3a. Environment Target Comparison

| Source                    | Safe finding                                                                                                                                                      | Interpretation                                                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root `.env`               | `DATABASE_URL` occurs twice, on lines 1 and 2. `dotenv.parse()` resolves a parseable Supabase pooler URL with the host/database/project reference reported above. | The configured URL used in the successful audit was the parsed effective value. The duplicate key is a configuration hygiene risk because other parsers may handle duplicate assignments differently; no other parser was run. |
| `.env.example`            | Uses `DATABASE_URL` with localhost PostgreSQL, port 5432, and database `identity_platform`.                                                                       | Template does not identify or match the connected cloud project.                                                                                                                                                               |
| `.env.production.example` | Uses `DATABASE_URL` with a production example hostname placeholder.                                                                                               | Placeholder only; it does not confirm the Supabase target.                                                                                                                                                                     |
| `.env.staging.example`    | Uses `DATABASE_URL` with a staging example hostname placeholder.                                                                                                  | Placeholder only; it does not confirm the Supabase target.                                                                                                                                                                     |
| Variable naming           | Repository config uses `DATABASE_URL`; no `SUPABASE_URL`/`SUPABASE_DB_URL` setting was found in the inspected configuration references.                           | The Supabase connection is selected through the generic PostgreSQL URL.                                                                                                                                                        |
| Other environment routes  | CI specifies local PostgreSQL; Docker/Kubernetes consume `DATABASE_URL` through environment/secret references.                                                    | No alternate Supabase URL value was found in checked-in deployment configuration; actual deployment secret contents are **NOT VERIFIED**.                                                                                      |

No configuration was modified. The duplicate `.env` key should be cleaned up separately by the configuration owner; this report does not change it.

### Final Read-Only Target Recheck

On 2026-10-01, `.env` was parsed again without displaying values. It still contains **two** `DATABASE_URL` assignments (lines 1 and 2); `dotenv.parse()` resolves the second, parseable assignment to the same host, port, database, and URL-derived project reference recorded above. A fresh TLS-required PostgreSQL client connection succeeded and a transaction was explicitly set READ ONLY before querying identity/catalog metadata. The database again returned PostgreSQL 17.11, database `postgres`, schema `public`, role `postgres`, 0/13 expected application tables in `public`, and no `__drizzle_migrations` ledger. This confirms the effective dotenv target is repeatable under this parser and connection attempt.

TLS precision: the client was configured with `ssl: 'require'` and connected successfully, so the client connection required TLS. A `pg_stat_ssl` lookup from the transaction-pooler backend returned no visible SSL row; because the endpoint is a transaction pooler, that result does not establish whether TLS is terminated at the pooler or used from pooler to PostgreSQL. Server-side/backend TLS is therefore **NOT VERIFIED**. No project reference was checked against Supabase Dashboard/control-plane metadata, so intended-project identity remains **NOT VERIFIED**.

No data from `auth`, `storage`, `realtime`, or `vault` tables was queried. The audit inspected relation names only.

## 4. Table Inventory

The expected application tables were searched in `public` and across all non-system schemas. All are absent.

| Expected application table | Actual `public` relation | Status  |
| -------------------------- | ------------------------ | ------- |
| `users`                    | Absent                   | MISSING |
| `email_identities`         | Absent                   | MISSING |
| `external_identities`      | Absent                   | MISSING |
| `password_credentials`     | Absent                   | MISSING |
| `sessions`                 | Absent                   | MISSING |
| `tenants`                  | Absent                   | MISSING |
| `memberships`              | Absent                   | MISSING |
| `permissions`              | Absent                   | MISSING |
| `tenant_roles`             | Absent                   | MISSING |
| `role_assignments`         | Absent                   | MISSING |
| `role_permissions`         | Absent                   | MISSING |
| `outbox_events`            | Absent                   | MISSING |
| `event_consumption`        | Absent                   | MISSING |

**Result: 0/13 expected application tables present.** No unexpected `public` base tables were found. Other non-system schemas contain Supabase-managed relations, which are not application tables and were left untouched.

## 5. Column Audit

The expected column sets below are from the checked-in Drizzle schemas and migration SQL. The actual public table is absent for every row, so each table has **no inspectable columns**. This is not an assertion that another database has the same state.

| Table                  | Expected columns from repository                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Live `public` columns | Status  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------- |
| `users`                | `id uuid PK`, `status text NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                                                                                                                                              | Relation absent       | MISSING |
| `email_identities`     | `id uuid PK`, `user_id uuid NOT NULL`, `email text NOT NULL`, `verified_at timestamptz NULL`, `primary boolean NOT NULL DEFAULT false`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                                            | Relation absent       | MISSING |
| `external_identities`  | `id uuid PK`, `user_id uuid NOT NULL`, `provider text NOT NULL`, `provider_subject text NOT NULL`, `identity_verified_at timestamptz NOT NULL`, `provider_email text NULL`, `provider_email_verified boolean NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                | Relation absent       | MISSING |
| `password_credentials` | `id uuid PK`, `user_id uuid NOT NULL`, `hashed_password text NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                                                                                                            | Relation absent       | MISSING |
| `sessions`             | `id uuid PK`, `user_id uuid NOT NULL`, `refresh_token_hash text NOT NULL`, `expires_at timestamptz NOT NULL`, `revoked_at timestamptz NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                                       | Relation absent       | MISSING |
| `tenants`              | `id uuid PK`, `name text NOT NULL`, `status text NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                                                                                                                        | Relation absent       | MISSING |
| `memberships`          | `id uuid PK`, `user_id uuid NOT NULL`, `tenant_id uuid NOT NULL`, `status text NOT NULL`, `joined_at timestamptz NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                                                        | Relation absent       | MISSING |
| `permissions`          | `id uuid PK`, `key text NOT NULL`, `scope text NOT NULL`, `display_name text NOT NULL`, `description text NULL`, `metadata jsonb NULL`, `status text NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                    | Relation absent       | MISSING |
| `tenant_roles`         | `id uuid PK`, `tenant_id uuid NOT NULL`, `key text NOT NULL`, `display_name text NOT NULL`, `description text NULL`, `status text NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                                       | Relation absent       | MISSING |
| `role_assignments`     | `id uuid PK`, `membership_id uuid NOT NULL`, `role_id uuid NOT NULL`, `status text NOT NULL`, `created_at timestamptz NOT NULL`, `updated_at timestamptz NOT NULL`                                                                                                                                                                                                                                                                                                                      | Relation absent       | MISSING |
| `role_permissions`     | `role_id uuid NOT NULL`, `permission_id uuid NOT NULL`, `created_at timestamptz NOT NULL`; no `id` or `status`                                                                                                                                                                                                                                                                                                                                                                          | Relation absent       | MISSING |
| `outbox_events`        | `id uuid PK`, `event_name text NOT NULL`, `event_version integer NOT NULL`, `aggregate_id uuid NOT NULL`, `aggregate_type text NOT NULL`, `payload jsonb NOT NULL`, `occurred_at timestamptz NOT NULL`, `created_at timestamptz NOT NULL DEFAULT now()`, `published_at timestamptz NULL`, `attempts integer NOT NULL DEFAULT 0`, `last_error text NULL`, `next_attempt_at timestamptz NULL`, `claimed_at timestamptz NULL`, `claimed_by text NULL`, `claim_expires_at timestamptz NULL` | Relation absent       | MISSING |
| `event_consumption`    | `event_id uuid NOT NULL`, `consumer_id text NOT NULL`, `consumed_at timestamptz NOT NULL DEFAULT now()`                                                                                                                                                                                                                                                                                                                                                                                 | Relation absent       | MISSING |

No table contents were queried. No row counts were requested.

## 6. Primary Key Audit

All ten expected aggregate UUID primary keys (`users.id`, `email_identities.id`, `external_identities.id`, `password_credentials.id`, `sessions.id`, `tenants.id`, `memberships.id`, `permissions.id`, `tenant_roles.id`, `role_assignments.id`) could not be found because their tables are absent.

The expected composite keys `role_permissions(role_id, permission_id)` and `event_consumption(event_id, consumer_id)` also cannot be found because those tables are absent.

**Cloud result: DRIFT / MISSING for all 12 expected primary-key definitions.** No actual PK constraint definitions exist on absent relations.

## 7. Foreign Key Audit

All 11 expected business/infrastructure FKs are absent with their parent/child tables:

| Expected FK                                       | Expected delete rule | Cloud status                |
| ------------------------------------------------- | -------------------- | --------------------------- |
| `email_identities.user_id → users.id`             | RESTRICT             | MISSING: both tables absent |
| `external_identities.user_id → users.id`          | RESTRICT             | MISSING: both tables absent |
| `password_credentials.user_id → users.id`         | RESTRICT             | MISSING: both tables absent |
| `sessions.user_id → users.id`                     | RESTRICT             | MISSING: both tables absent |
| `memberships.user_id → users.id`                  | RESTRICT             | MISSING: both tables absent |
| `memberships.tenant_id → tenants.id`              | RESTRICT             | MISSING: both tables absent |
| `tenant_roles.tenant_id → tenants.id`             | RESTRICT             | MISSING: both tables absent |
| `role_assignments.membership_id → memberships.id` | RESTRICT             | MISSING: both tables absent |
| `role_assignments.role_id → tenant_roles.id`      | RESTRICT             | MISSING: both tables absent |
| `role_permissions.role_id → tenant_roles.id`      | RESTRICT             | MISSING: both tables absent |
| `role_permissions.permission_id → permissions.id` | RESTRICT             | MISSING: both tables absent |

No application foreign keys were present to test for `CASCADE`. **Do not interpret this as proof that the frozen RESTRICT relationships are deployed.** Cloud FK result: **DRIFT**.

## 8. Unique Constraint Audit

The live catalog contains no expected application tables and no related indexes. Therefore all expected uniqueness rules are **MISSING in this database**. Exact cloud index definitions cannot be obtained for absent tables.

| Constraint/index                                                 | Drizzle schema                  | Migration SQL                                                          | Latest snapshot                              | Cloud PostgreSQL      |
| ---------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | --------------------- |
| `email_identities(email)` UNIQUE                                 | Yes, inline `.unique()`         | Yes, `uq_email_identities_email`                                       | Email unique represented with generated name | Table absent; MISSING |
| `external_identities(provider, provider_subject)` UNIQUE         | No; comment only                | Yes, `uq_external_identities_provider_subject` unique index            | No                                           | Table absent; MISSING |
| `password_credentials(user_id)` UNIQUE                           | No; comment says added manually | Yes, `uq_password_credentials_user_id` table constraint                | No in 0000–0004                              | Table absent; MISSING |
| `permissions(key)` UNIQUE                                        | Yes, named                      | Yes, `uq_permissions_key`                                              | No in latest snapshot                        | Table absent; MISSING |
| `tenant_roles(tenant_id, key)` UNIQUE                            | Yes, named                      | Yes, `uq_tenant_roles_tenant_key`                                      | No in latest snapshot                        | Table absent; MISSING |
| `email_identities(user_id) WHERE primary=true`                   | No; comment only                | Yes, `uq_email_identities_primary_user` partial unique index           | No                                           | Table absent; MISSING |
| `memberships(user_id, tenant_id) WHERE status='ACTIVE'`          | No; comment only                | Yes, `uq_memberships_active_user_tenant` partial unique index          | No                                           | Table absent; MISSING |
| `role_assignments(membership_id, role_id) WHERE status='ACTIVE'` | No; comment only                | Yes, `uq_role_assignments_active_membership_role` partial unique index | No                                           | Table absent; MISSING |

**PasswordCredential result: `password_credentials` table and `user_id` UNIQUE are MISSING in this connected database.** This is a verified result for the connected endpoint, not for any other environment.

## 9. Check Constraint Audit

No application table exists in `public`, therefore none of these CHECK definitions is present in this database:

| Expected check                                           | Local SQL                 | Local Drizzle DSL | Cloud                                                       |
| -------------------------------------------------------- | ------------------------- | ----------------- | ----------------------------------------------------------- |
| `users.status IN ('ACTIVE','SUSPENDED','DELETED')`       | Yes, `chk_users_status`   | No                | MISSING                                                     |
| `tenants.status IN ('ACTIVE','SUSPENDED','DELETED')`     | Yes, `chk_tenants_status` | No                | MISSING                                                     |
| `memberships.status IN ('ACTIVE','SUSPENDED','DELETED')` | No                        | No                | MISSING; invariant is not represented as a DB check locally |
| `permissions.scope IN ('TENANT','PLATFORM')`             | Yes                       | Yes               | MISSING                                                     |
| `permissions.status IN ('ACTIVE','DELETED')`             | Yes                       | Yes               | MISSING                                                     |
| `tenant_roles.status IN ('ACTIVE','DELETED')`            | Yes                       | Yes               | MISSING                                                     |
| `role_assignments.status IN ('ACTIVE','DELETED')`        | Yes                       | Yes               | MISSING                                                     |
| `outbox_events.event_version >= 1`                       | Yes                       | Yes               | MISSING                                                     |
| `outbox_events.attempts >= 0`                            | Yes                       | Yes               | MISSING                                                     |

Cloud CHECK result: **DRIFT**.

## 10. Index Audit

No expected application tables or application indexes exist in the connected database. All expected operational indexes below are **MISSING in this database**:

- Sessions: `idx_sessions_user_id`, `idx_sessions_expires_at`.
- Email identities: `idx_email_identities_user_id`.
- External identities: `idx_external_identities_user_id`.
- Memberships: `idx_memberships_user_id`, `idx_memberships_tenant_id`.
- Tenant roles: unique `(tenant_id,key)` creates its supporting unique index in PostgreSQL; table is absent.
- Role assignments: `idx_role_assignments_membership_id`, `idx_role_assignments_role_id`, and active-pair partial unique index.
- Role permissions: role and permission indexes.
- Outbox: `idx_outbox_events_aggregate(aggregate_id, aggregate_type)`, `idx_outbox_events_occurred_at(occurred_at)`, and `idx_outbox_events_retry(next_attempt_at, created_at) WHERE published_at IS NULL`.

The repository SQL does **not** define a separately named outbox “pending” index; only the retry partial index with `published_at IS NULL` is present. Local Drizzle schema declares sessions and email user indexes; several other listed indexes are migration-only. Exact cloud definitions are unavailable because the target tables are absent. Index result: **DRIFT**.

## 11. Migration History

**Live PostgreSQL:** no `__drizzle_migrations` relation was found in any non-system schema; neither `public.__drizzle_migrations` nor `drizzle.__drizzle_migrations` exists. No project migration entries/hashes/timestamps were available. Supabase vendor schemas expose service migration table names, but their contents were not read and they are not evidence of this project's migrations.

**Local artifacts:** SQL files are `0000_identity.sql`, `0001_tenant.sql`, `0002_authorization.sql`, `0003_outbox.sql`. Journal has idx 0–4 tagged `0000_open_avengers`, `0001_thin_wilson_fisk`, `0002_little_hedge_knight`, `0003_abandoned_fenris`, `0004_talented_rhodey`. No exact tag-named SQL file exists. Snapshots 0000–0004 form a continuous `prevId` chain; snapshot 0004 contains outbox schema but no matching SQL file. No DB applied migration record correlates to idx 4.

## 12. Migration Route Analysis

| Route                          | Directory                                                        | History mechanism                                                                           | Failure behavior                                                                           | Production status                                                                                                |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Root `pnpm db:migrate`         | Defaults to `modules/iam/src/infrastructure/database/migrations` | Custom `__drizzle_migrations` name/hash/time ledger and schema fingerprint/baseline support | CLI exits nonzero on runner failure; runner verifies file/history hashes.                  | Root command is configured; no deployment workflow invocation was found. Actual production use **NOT VERIFIED**. |
| Platform `db:migrate`          | `packages/platform-database/migrations`                          | Drizzle journal plus DB `drizzle.__drizzle_migrations` hash/time table                      | Current journal tags do not map to SQL filenames; reader fails before migration execution. | Available script, not shown as production route.                                                                 |
| Platform `db:apply-migrations` | `packages/platform-database/migrations`                          | No journal/history check                                                                    | Catches statement errors, continues, can report success after partial failure.             | Available script, not shown as production route.                                                                 |
| Platform `db:push`             | Drizzle config schema paths                                      | Direct schema push, not migration-file history                                              | Not run in this audit.                                                                     | Available script; production use **NOT VERIFIED**.                                                               |

The root package has the configured `db:migrate` script, but no `.github` workflow references these commands. Repository configuration alone cannot prove which command, if any, was executed against this connected database.

## 13. Migration Integrity

| Comparison                                  | Result                                                                                    | Classification                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Cloud application tables vs expected        | 0/13 present                                                                              | VERIFIED                                                                                |
| Cloud project migration ledgers             | No `__drizzle_migrations` in non-system schemas                                           | VERIFIED                                                                                |
| Journal tags vs exact SQL filenames         | All five entries lack matching files                                                      | VERIFIED                                                                                |
| Present SQL files vs journal tags           | Four numbered SQL files exist, but filenames differ from all tags                         | VERIFIED                                                                                |
| Snapshot chain                              | `prevId` chain 0000→0004 is continuous                                                    | VERIFIED                                                                                |
| Snapshot 0004 vs SQL                        | Snapshot has outbox structures, no corresponding tag-matching SQL file                    | VERIFIED                                                                                |
| SQL files without numeric snapshots         | No numbered 0000–0003 gap detected                                                        | VERIFIED                                                                                |
| Snapshot without matching SQL               | 0004 snapshot has no 0004-tag SQL file                                                    | VERIFIED                                                                                |
| Root runtime applied history in cloud       | No project ledger found; no entries available                                             | NOT VERIFIED beyond ledger absence                                                      |
| Meaning of missing idx 4 artifact           | Cause/provenance not in repo evidence                                                     | NOT VERIFIED                                                                            |
| Why unique/check/index constraints diverged | Exact historical cause not found                                                          | INFERENCE only where comments say “manually added”; provenance remains UNKNOWN          |
| Duplicate migration definitions             | No execution comparison performed; 0004 snapshot overlaps outbox structures from 0003 SQL | INFERENCE: possible generation/history divergence, not proof of duplicate DDL execution |

Migration integrity result: **BLOCKED**.

## 14. Drizzle vs Migration vs Snapshot vs Cloud DB

| Object                                        | Drizzle schema                                                                | Migration SQL                                  | Latest snapshot                                                 | Cloud public      | Status                         |
| --------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- | ----------------- | ------------------------------ |
| 13 expected tables/columns                    | All declared in module/platform schema                                        | 13 table definitions across SQL 0000–0003      | Latest snapshot has schema metadata, but incomplete constraints | 0/13 tables       | Cloud missing; overall DRIFT   |
| `users.status` CHECK                          | Absent                                                                        | Present in 0000                                | Absent                                                          | Table absent      | DRIFT                          |
| `password_credentials.user_id` UNIQUE         | Absent                                                                        | Present in 0000                                | Absent 0000–0004                                                | Table absent      | DRIFT; cloud invariant MISSING |
| Email primary partial UNIQUE                  | Absent                                                                        | Present in 0000                                | Absent                                                          | Table absent      | DRIFT                          |
| External provider/subject UNIQUE              | Absent                                                                        | Present in 0000                                | Absent                                                          | Table absent      | DRIFT                          |
| Active membership pair UNIQUE                 | Absent                                                                        | Present in 0001                                | Absent                                                          | Table absent      | DRIFT                          |
| Permissions/tenant-role declared UNIQUE/CHECK | Present                                                                       | Present in 0002                                | Absent in latest snapshot                                       | Tables absent     | DRIFT                          |
| Role permission composite PK                  | Absent from DSL                                                               | Present in 0002                                | Absent                                                          | Table absent      | DRIFT                          |
| Outbox/event-consumption tables               | Platform DSL declares table fields/checks; several indexes/PK are not modeled | Present in 0003 SQL                            | Present in 0004 snapshot                                        | Tables absent     | DRIFT                          |
| Migration tag/file correspondence             | N/A                                                                           | Actual files named by domain, not journal tags | Snapshots numbered through 0004                                 | No project ledger | BLOCKED                        |

Every cloud “table absent” status is directly observed. Local artifact mismatches are directly observed in checked-in schema, SQL, snapshot, and journal files. No schema-changing generation command was run.

## 15. Identity Compatibility

The physical database cannot support the checked-in Identity persistence architecture in its current state: all five tables (`users`, `email_identities`, `external_identities`, `password_credentials`, `sessions`) are absent from `public` and other non-system schemas.

- User → EmailIdentity, ExternalIdentity, PasswordCredential, Session FKs: not deployed in observed DB.
- One PasswordCredential per User: not deployed in observed DB.
- Email primary protection and external provider/subject uniqueness: not deployed in observed DB.
- Session tenant independence: no application `sessions` table exists. The checked-in schema/SQL omit `tenant_id`, but the cloud layout cannot confirm a table that is absent.
- Session forbidden fields (`tenant_id`, `access_token`, `device_info`, `ip_address`, `user_agent`): no project Session table exists in inspected schema. No column data elsewhere was queried.

**Identity status: INCOMPATIBLE** with the frozen architecture in this connected database, based on missing tables.

## 16. IAM / Access-Control Compatibility

The physical database has none of the project `memberships`, `tenant_roles`, `role_assignments`, `role_permissions`, or `permissions` tables in `public` or another non-system schema. The local model says Membership links User↔Tenant; RoleAssignment links Membership↔TenantRole; TenantRole belongs to Tenant; RolePermission links TenantRole↔Permission; Permission is global and has no `tenant_id`; role_permissions has no status column and is insert/delete relationship persistence.

The local Session schema has no `tenant_id`; this verifies intended source shape only, not a deployed cloud property. The local RolePermission schema documents insert/delete persistence, consistent with physical revoke semantics. No live table exists to verify either property.

The local schema comments document permission-scope compatibility as application enforcement. No `PlatformRole` table is declared in the inspected module schema. The database itself cannot verify these absent physical structures.

**IAM / Access-Control status: INCOMPATIBLE** with the frozen architecture in this connected database, based on missing relations.

## 17. Identity + IAM Compatibility

No project identity, tenant, or IAM tables exist in the connected database; thus neither the tenant authorization graph nor independent user sessions/identity relations are physically represented. Session tenant independence and cross-module FK integrity are **NOT VERIFIED as deployed properties**.

**Identity + IAM status: INCOMPATIBLE** for the observed database state. The local source architecture remains as previously defined; this result does not change it.

## 18. Tenant Isolation

Live `memberships.tenant_id` and `tenant_roles.tenant_id` do not exist because the tables are absent. Cloud FK, uniqueness, or equality constraints cannot be inspected.

Repository-source distinction:

- DB-enforced in intended SQL: FK existence, unique active membership pair, unique tenant-role `(tenant_id,key)`, and declared status checks where present.
- Application-enforced in comments/design: membership tenant equality with assigned role's tenant; actor authorization; permission scope compatibility; last-admin rules; resource ownership and policy evaluation.

No extra database constraint was proposed or created. Cloud tenant isolation support: **NOT VERIFIED; required tables missing**.

## 19. Outbox Verification

Neither `outbox_events` nor `event_consumption` exists in the observed application schema. Therefore live columns, `event_version >= 1`, `attempts >= 0`, aggregate/occurred/retry indexes, event-consumption composite PK, and RESTRICT FK are all **MISSING** in this database.

Local migration 0003 declares outbox fields, those two CHECKs, `event_consumption(event_id,consumer_id)` composite PK, RESTRICT event FK, and three indexes: aggregate, occurred-at, and retry partial (`published_at IS NULL`). There is no separate SQL “pending” index. No event was published or consumed.

**Outbox result: DRIFT.**

## 20. Security Verification

No application tables exist in `public`, so no application columns storing password/session/provider secrets were found there. The database audit did not select business rows or inspect actual credential values. Supabase service schemas were inventoried by relation name only; their columns/data were not read.

Repository expectation is `hashed_password` only for PasswordCredential and `refresh_token_hash` only for Session. No project PasswordCredential or Session table exists in the connected database. Therefore the cloud schema security requirements are **NOT VERIFIED as implemented**; they are not marked as passed based only on the absence of those tables.

## 21. PasswordCredentialRepository Readiness

| Required live property              | Cloud result              |
| ----------------------------------- | ------------------------- |
| `password_credentials` table exists | NO                        |
| `id uuid PRIMARY KEY`               | NOT PRESENT; table absent |
| `user_id uuid NOT NULL`             | NOT PRESENT; table absent |
| `user_id → users.id` FK             | NOT PRESENT; table absent |
| `user_id UNIQUE`                    | MISSING; table absent     |
| `hashed_password`                   | NOT PRESENT; table absent |
| `created_at`, `updated_at`          | NOT PRESENT; table absent |
| FK `ON DELETE RESTRICT`             | NOT PRESENT; table absent |

The earlier UserRepository qualification evidence is architecture/test evidence, not evidence that this particular Supabase database has the qualified tables. **PasswordCredentialRepository readiness: BLOCKED.**

## 22. Transaction / UoW Compatibility

The PostgreSQL server accepted a read-only transaction and catalog queries, proving the endpoint supports PostgreSQL transactions at the server level. No Drizzle client or `DrizzleUnitOfWork` was executed against the target; expected tables and schemas are absent. Therefore real UoW commit/rollback behavior against this database is **NOT VERIFIED**.

The application `IUnitOfWork` still has only `execute<T>()`; no schema-awareness or transaction ownership was added. Cloud transaction boundary: **REVIEW REQUIRED** (server transaction capability verified; application UoW integration not qualified).

## 23. Error Boundary

Local `PersistenceError` hierarchy resides in `packages/platform-database/src/persistence/PersistenceError.ts`. `DrizzleUnitOfWork.mapPersistenceError()` maps PostgreSQL integrity SQLSTATE class `23`, with dedicated handling for `23505`, `23503`, `23502`, and `23514`; other class-23 codes become base `PersistenceError`; non-matching errors are rethrown. Repository adapters do not map raw PostgreSQL errors.

`PasswordCredentialNotFoundError` is absent and its contract remains **NOT FROZEN**. No DB write/constraint test was performed against Supabase.

## 24. Type Safety

Relevant existing `any` findings from source audit:

| Boundary               | Existing use                                                               | Classification                                                       |
| ---------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `TransactionContext`   | Stored transaction, `activate(tx)`, `getTransaction()` use `any`.          | Infrastructure internal API; unsafe type propagates to repositories. |
| `DrizzleUnitOfWork`    | DB client, mapper error, transaction callback, catch error use `any`.      | Infrastructure internal implementation.                              |
| `createDatabaseClient` | Schema argument is `any`.                                                  | Infrastructure schema-composition boundary.                          |
| User integration test  | DB fixture is `any`; `unitOfWork.test.ts` also uses `as any` test doubles. | Test-only.                                                           |
| `MigrationRunner`      | `catalog?: any`, `journalEntries: any[]`.                                  | Migration tooling.                                                   |
| `IUnitOfWork`          | No `any`; `execute<T>(work: () => Promise<T>): Promise<T>`.                | Application port remains typed and unchanged.                        |

These violate a literal zero-any quality requirement at infrastructure/test/tooling boundaries. No type changes were made. Type status: **REVIEW REQUIRED**.

## 25. Risks

- The configured cloud database has no application schema, but repository migration state is also absent; this may be an uninitialized target or the wrong Supabase project/database. **INFERENCE**, not resolved by the hidden endpoint.
- Running any migration command would be unsafe until architecture owner identifies intended target and migration authority. No migration was run.
- Existing local journal tags and SQL filenames disagree; Drizzle migrate is blocked by that local artifact mismatch.
- Platform SQL-glob runner suppresses per-statement errors and has no applied-history ledger; do not use it as proof of successful provisioning.
- The no-`any` quality gate conflicts with existing infrastructure transaction/client types.
- No project data was read, so no data duplication or unique-constraint preflight was performed.

## 26. VERIFIED / INFERENCE / NOT VERIFIED Classification

**VERIFIED — live database:**

- Connection through configured `.env` succeeded; PostgreSQL reports 17.11.
- Database metadata reports database `postgres`, current schema `public`, and search path `"$user", public, extensions`.
- No expected application table exists in `public` or another non-system schema.
- No unexpected public base table exists.
- No project `__drizzle_migrations` table exists in non-system schemas.
- Catalog queries were in a transaction explicitly set READ ONLY; no mutation statements were run.
- Final repeat parsed exactly two `.env` `DATABASE_URL` assignments; `dotenv.parse()` selected the same safe endpoint metadata and read-only connection/catalog result.
- Client-side TLS was required and the connection succeeded; this does not verify the pooler-to-server TLS leg.

**VERIFIED — repository:**

- Root configured `db:migrate` command routes to custom migration runtime and defaults to legacy IAM migrations.
- Drizzle schema config loads platform and three module schema barrels.
- Local migration journal has five tags, none with matching SQL filenames; four SQL migration files exist.
- `0004` snapshot exists and is linked into the snapshot chain, but no corresponding SQL file exists.
- Local `password_credentials` SQL has `uq_password_credentials_user_id`; DSL and snapshots do not.
- Error mapping is at UoW; PasswordCredential-specific not-found type is absent.

**INFERENCE:**

- The connected empty application schema may mean this Supabase database is uninitialized or not the intended target. No project identifier was recorded to distinguish these.
- A new schema-generated UNIQUE migration may collide with an existing deployment's constraint on a different database. This connected database has no PasswordCredential table, so this risk is not observed here.
- The `0004` snapshot/outbox overlap may indicate lost, omitted, or otherwise divergent migration history; the exact cause is unknown.

**NOT VERIFIED:**

- Whether project reference `dovogoonhvpqmjijsihc` matches the intended Supabase Dashboard project, or whether this is production/a dedicated test project.
- Whether Supabase transaction pooler terminates TLS before the PostgreSQL backend; no `pg_stat_ssl` row was visible for the pooled backend.
- Any business-table schema, columns, indexes, constraints, or applied project migration entries: those objects are absent here.
- Existing project migration history on any other database.
- Actual production use of any repository migration route; no `.github` workflow call was found.
- Drizzle UoW commit/rollback behavior against this cloud endpoint.
- Data duplicates/preflight in another database.

## 27. Recommended Next Decision

Before unfreezing Step 3, obtain architecture-owner decisions in this order:

1. Confirm whether this connected Supabase database is the intended target (and environment classification) without exposing endpoint credentials.
2. Select the canonical migration authority and supported fresh-install/upgrade route.
3. Reconcile migration journal tags, SQL files, snapshots, and runner ledgers without rewriting applied history.
4. Decide how schema declarations/snapshots will be reconciled against forward-only migration history.
5. Approve a type-safe infrastructure transaction boundary that preserves the frozen `IUnitOfWork` contract.
6. Freeze `PasswordCredentialNotFoundError` and `delete(missing)` semantics.

Before any later mutation, remove the duplicate `DATABASE_URL` assignment and perform one final sanitized parse/target confirmation. This audit intentionally did not edit `.env`.

Do not implement the repository or apply schema migrations until the database target is confirmed and migration authority is resolved.

## No-Change Guarantee

```text
SOURCE CODE CHANGED BY THIS AUDIT = NO
MIGRATIONS CHANGED BY THIS AUDIT = NO
SCHEMA CHANGED BY THIS AUDIT = NO
SNAPSHOTS CHANGED BY THIS AUDIT = NO
JOURNAL CHANGED BY THIS AUDIT = NO
DATABASE MUTATED = NO
DOCUMENTATION CHANGED BY THIS AUDIT = YES (this report only)
```

Scoped Git status showed this new report and the preceding investigation report as untracked. It also showed several source/schema/migration paths and files as untracked, plus other modified/deleted workspace files. Because untracked files have no `HEAD` diff, Git cannot establish their baseline content or prior history in this workspace. This audit's tool actions edited only this new Markdown report; no protected source or migration file was edited, staged, or reverted. Existing user worktree changes were left intact.

## 28. Final Status

```text
==================================================
PHASE 6W STEP 3 — CLOUD DATABASE GATE
==================================================

Cloud PostgreSQL:
CONNECTED

Real DB metadata inspected:
YES

Database mutation:
NONE

Tables:
0/13 (all expected tables missing)

Identity:
INCOMPATIBLE

IAM:
INCOMPATIBLE

Identity + IAM:
INCOMPATIBLE

PasswordCredential.user_id UNIQUE:
MISSING (table absent in connected database)

Foreign Keys:
DRIFT

Indexes:
DRIFT

CHECK constraints:
DRIFT

Outbox:
DRIFT

Migration history:
BLOCKED

Migration authority:
UNRESOLVED

Transaction boundary:
REVIEW REQUIRED

Type safety:
REVIEW REQUIRED

PasswordCredentialRepository:
BLOCKED

Overall:
CONTRACT STILL BLOCKED
==================================================
```
