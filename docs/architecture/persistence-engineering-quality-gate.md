# Persistence Engineering Quality Gate

## Purpose and Use

This is the reusable review and qualification gate for concrete repository implementations. It supplements, and does not replace, the frozen architecture in [repository-reference-pattern.md](repository-reference-pattern.md). It introduces no repository base class, specification system, factory, or generic CRUD layer.

Evaluate every rule as `PASS`, `FAIL`, `N/A`, or `NOT RUN`. `N/A` needs a reason. Each `PASS` must cite inspectable evidence: path/symbol, test name and result, command output, migration/snapshot, or recorded PostgreSQL run. A rule is not passed by intent, comments alone, or a mocked database. A waiver must identify the rule, rationale, scope, owner, expiry/revisit condition, and compensating evidence.

`Rule` states the required property; `Risk` names the failure; `Enforce` identifies the control; `Test` identifies a verification; `Evidence` names the artifact to retain. Apply the common rows to each repository and the credential rows to secret-bearing repositories. Existing legacy exceptions must be explicit allow-list entries; they do not authorize new violations.

This document is currently a manual review/qualification standard, not an implemented CI policy. Suggested enforcement is not evidence until the corresponding script, lint rule, migration check, or test exists and has been run.

### Current Baseline Constraint

The frozen `TransactionContext.getTransaction()` API currently returns `any`, and the Drizzle UoW also uses `any` at its transaction/client boundary. Therefore a literal “no `any` flows into new adapters” rule cannot pass without typing that existing boundary. Before applying TYP-01 as a hard gate, approve a behavior-preserving type-boundary change or explicitly scope TYP-01 to new declarations while tracking propagated unsafe values as a separate blocker. Do not hide this baseline with casts, lint suppressions, or a silent waiver.

## Architecture (ARC)

| ID     | Rule                                                              | Risk                        | Enforce                    | Test                                    | Evidence              |
| ------ | ----------------------------------------------------------------- | --------------------------- | -------------------------- | --------------------------------------- | --------------------- |
| ARC-01 | Dependencies point inward at domain contracts.                    | Infrastructure leakage.     | Import-boundary lint.      | Dependency graph check.                 | Import graph.         |
| ARC-02 | Domain imports no DB, SQL, or ORM package.                        | Domain tied to storage.     | Restricted imports.        | Static dependency scan.                 | Scan output.          |
| ARC-03 | Repository port uses domain-level types only.                     | Vendor types escape.        | Port review.               | Typecheck and import scan.              | Port source.          |
| ARC-04 | Adapter implements its declared port.                             | Contract drift.             | `implements` clause.       | Typecheck.                              | Adapter and port.     |
| ARC-05 | No generic repository abstraction without proven repetition.      | Premature coupling.         | Architecture review.       | Search for generic base/specification.  | Search result.        |
| ARC-06 | Repository contains persistence operations, not business policy.  | Policy split or bypass.     | Responsibility review.     | Behavior test at use-case/domain layer. | Code review record.   |
| ARC-07 | No synthetic use case is added to justify an adapter.             | Fake product behavior.      | Scope review.              | Consumer search.                        | Search output.        |
| ARC-08 | Module schema remains owned by its module.                        | Platform/business coupling. | Import-boundary check.     | Schema dependency test.                 | Schema graph.         |
| ARC-09 | Composition root supplies the complete schema.                    | Missing table metadata.     | Single client composition. | Composition smoke test.                 | Composition root.     |
| ARC-10 | Adapter receives its transaction context explicitly.              | Hidden/global transaction.  | Constructor injection.     | Inactive-context test.                  | Constructor and test. |
| ARC-11 | Same-UoW repositories share the same context instance.            | Split atomic work.          | Composition binding.       | Context identity/integration test.      | Wiring test.          |
| ARC-12 | Adapter does not construct clients, pools, or transaction scopes. | Orphan transaction.         | Dependency scan/review.    | Search for client/transaction creation. | Search result.        |

## Types and Mapping (TYP)

| ID     | Rule                                                         | Risk                    | Enforce                            | Test                                 | Evidence               |
| ------ | ------------------------------------------------------------ | ----------------------- | ---------------------------------- | ------------------------------------ | ---------------------- |
| TYP-01 | New repository/mapper code adds no `any`.                    | Lost guarantees.        | Strict TS review.                  | Typecheck and lint scan.             | Diagnostics/search.    |
| TYP-02 | Unsafe casts are absent or justified at typed boundary.      | Invalid row accepted.   | Prefer inferred Drizzle types.     | Static scan plus malformed-row test. | Cast inventory.        |
| TYP-03 | `unknown` is narrowed before use.                            | Runtime type confusion. | Type guards.                       | Typecheck.                           | Guard and diagnostics. |
| TYP-04 | Domain IDs remain typed outside mapper boundary.             | IDs mixed accidentally. | Accept typed IDs in port.          | Compile-time misuse test.            | Port types.            |
| TYP-05 | Raw strings are converted at mapper boundary.                | Primitive leakage.      | Construct validated value objects. | Mapper test.                         | Mapper test result.    |
| TYP-06 | Nullable reads are handled explicitly.                       | Null dereference.       | Branch on row count.               | Missing-row test.                    | Test result.           |
| TYP-07 | Persisted enum/state values are validated.                   | Invalid domain state.   | Explicit mapping/guard.            | Invalid-value mapper test.           | Test result.           |
| TYP-08 | Drizzle row/insert types are inferred from tables.           | Shape drift.            | `$inferSelect`/`$inferInsert`.     | Typecheck.                           | Type declarations.     |
| TYP-09 | No unchecked non-null assertion is introduced.               | Hidden null failure.    | Narrow before access.              | Lint/static scan.                    | Diagnostics.           |
| TYP-10 | No `@ts-ignore` or equivalent suppresses repository defects. | Errors hidden.          | Forbid; document rare suppression. | Suppression scan.                    | Search output.         |
| TYP-11 | Mapper output exactly satisfies the insert/update shape.     | Missing/stale fields.   | Typed return value.                | Typecheck and round-trip.            | Mapper signature/test. |
| TYP-12 | Dates, IDs, and nullable columns preserve their types.       | Silent data corruption. | Explicit conversions.              | Round-trip test.                     | Test assertions.       |

## Database Integrity (DB)

| ID    | Rule                                                              | Risk                                | Enforce                                | Test                             | Evidence                 |
| ----- | ----------------------------------------------------------------- | ----------------------------------- | -------------------------------------- | -------------------------------- | ------------------------ |
| DB-01 | Drizzle schema expresses every managed invariant.                 | Hidden schema drift.                | Compare DSL, snapshot, SQL.            | Schema parity check.             | Diff report.             |
| DB-02 | Migrations are append-only after application.                     | Existing DB histories diverge.      | Forward-only migration policy.         | Migration history review.        | Journal and files.       |
| DB-03 | Migration journal entries resolve to migration files.             | Runner inconsistency.               | Journal/file validation.               | CI integrity check.              | Journal check output.    |
| DB-04 | Snapshot represents the post-migration schema.                    | Generator emits wrong diff.         | Snapshot parity review.                | Generate/diff in clean worktree. | Snapshot diff.           |
| DB-05 | PK columns and names match the aggregate identity.                | Duplicate/unstable identity.        | Explicit PK declaration.               | Duplicate-ID PostgreSQL test.    | Constraint/test output.  |
| DB-06 | FK targets and column types match.                                | Orphan references.                  | Typed references.                      | Invalid-FK PostgreSQL test.      | FK metadata/test.        |
| DB-07 | FK delete action matches lifecycle policy.                        | Accidental cascade/loss.            | Explicit `RESTRICT`/approved action.   | Delete-parent integration test.  | DDL/test output.         |
| DB-08 | UNIQUE constraints exist in both desired schema and deployed DDL. | Concurrent duplicates.              | Named constraint in DSL and migration. | Duplicate-row PostgreSQL test.   | Schema/SQL/test.         |
| DB-09 | NOT NULL constraints match domain-required fields.                | Partial aggregates.                 | Non-null columns.                      | Null insert PostgreSQL test.     | DDL/test result.         |
| DB-10 | CHECK constraints encode only stable persistence invariants.      | Invalid stored values.              | Named check in schema/migration.       | Invalid-value PostgreSQL test.   | DDL/test result.         |
| DB-11 | Indexes serve actual repository predicates.                       | Slow lookup or write overhead.      | Query/index review.                    | `EXPLAIN` or index catalog test. | Plan/catalog output.     |
| DB-12 | Composite and partial indexes match exact predicate semantics.    | Uniqueness gaps/races.              | Review predicate and columns.          | Concurrent constraint test.      | DDL/test output.         |
| DB-13 | DB defaults are not assumed unless declared.                      | Runtime/insert mismatch.            | Explicit insert mapping.               | Insert/read-back test.           | Schema and test.         |
| DB-14 | Generated IDs are not introduced without aggregate approval.      | Identity ownership changes.         | Explicit ID persistence.               | Insert/read-back test.           | Mapper and DDL.          |
| DB-15 | No schema column is added merely for adapter convenience.         | Unapproved model drift.             | Scope/design review.                   | Schema diff review.              | Approved decision.       |
| DB-16 | Repository updates only intended mutable fields.                  | Immutable data overwritten.         | Aggregate-specific update mapping.     | Before/after integration test.   | Test result.             |
| DB-17 | Physical versus logical deletion matches the aggregate model.     | Lifecycle/data-retention violation. | Explicit port semantics.               | Delete/read-back test.           | Contract and result.     |
| DB-18 | DB errors in tests are produced by the DB, not fabricated.        | False constraint confidence.        | Real PostgreSQL fixture.               | Violation integration test.      | PostgreSQL run record.   |
| DB-19 | Migration runners fail the run when any statement fails.          | False deployment success.           | Fail-fast/error aggregation.           | Injected migration failure test. | Exit status/log.         |
| DB-20 | Test DB setup is isolated and non-destructive.                    | Production or user data loss.       | Dedicated DB/schema policy.            | Target identity assertion.       | Setup config/run record. |

## Security and Sensitive Data (SEC)

| ID     | Rule                                                        | Risk                            | Enforce                                 | Test                          | Evidence             |
| ------ | ----------------------------------------------------------- | ------------------------------- | --------------------------------------- | ----------------------------- | -------------------- |
| SEC-01 | Plaintext secrets never enter persistence models.           | Credential compromise.          | Port accepts only approved secret form. | Source/data-flow scan.        | Scan output.         |
| SEC-02 | Secret hashes are never logged.                             | Offline attack enablement.      | Redacted logging policy.                | Capture logger output.        | Redaction test.      |
| SEC-03 | Secret values are absent from exception messages.           | Error-channel disclosure.       | Stable generic errors.                  | Error-message assertions.     | Test result.         |
| SEC-04 | Secret values are absent from domain event payloads.        | Event-bus disclosure.           | Event contract review.                  | Serialize event and scan.     | Event test.          |
| SEC-05 | Secret values are absent from API/response mapping.         | Client disclosure.              | DTO allow-list.                         | Serialization test.           | DTO test.            |
| SEC-06 | Test fixtures use synthetic, non-reusable secrets.          | Test data becomes credential.   | Fixed fake encodings only.              | Fixture scan/review.          | Test fixture source. |
| SEC-07 | Test output does not print stored secrets.                  | CI log leakage.                 | No raw object dumps.                    | Failure/output scan.          | CI log artifact.     |
| SEC-08 | Repository does not hash or validate plaintext.             | Security policy in wrong layer. | Keep crypto outside adapter.            | Source scan.                  | Adapter review.      |
| SEC-09 | Repository reads only fields required by its contract.      | Excess exposure.                | Narrow selection where practical.       | Query/DTO review.             | Query source.        |
| SEC-10 | Untrusted IDs/values are not interpolated into SQL strings. | Injection.                      | Drizzle parameterized API.              | Static scan/integration test. | Query source.        |
| SEC-11 | Error metadata is limited to safe constraint identifiers.   | PII/secret leakage.             | Allow-list error details.               | Error serialization test.     | Test result.         |
| SEC-12 | Security-sensitive delete runs in caller's UoW.             | Partial security workflow.      | Shared context.                         | Rollback integration test.    | Test result.         |

## Transaction and Concurrency (TX)

| ID    | Rule                                                      | Risk                             | Enforce                           | Test                             | Evidence            |
| ----- | --------------------------------------------------------- | -------------------------------- | --------------------------------- | -------------------------------- | ------------------- |
| TX-01 | Every operation requires an active context.               | Autocommit outside use case.     | `getTransaction()` first.         | Inactive-context test.           | Test result.        |
| TX-02 | Repository never calls `transaction()`.                   | Nested/independent transaction.  | Static search.                    | Architecture scan.               | Search output.      |
| TX-03 | Repository never commits, rolls back, or begins.          | Broken atomicity.                | No lifecycle APIs in adapter.     | Static search.                   | Search output.      |
| TX-04 | Multi-repository work uses one UoW/context.               | Partial commit.                  | Composition binding.              | Cross-repository atomicity test. | Integration result. |
| TX-05 | Successful work is visible only after UoW commit.         | Premature durability assumption. | UoW owns completion.              | Commit visibility test.          | PostgreSQL result.  |
| TX-06 | Failed work rolls back all participating writes.          | Partial state.                   | Propagate failure.                | Multi-write rollback test.       | PostgreSQL result.  |
| TX-07 | Constraint races are protected by DB constraints.         | Check-then-insert race.          | No existence-check as sole guard. | Concurrent duplicate test.       | PostgreSQL result.  |
| TX-08 | Isolation claims match configured DB behavior.            | False concurrency guarantee.     | Record isolation level.           | Concurrent transaction test.     | Config/result.      |
| TX-09 | Context is not reused after completion.                   | Stale transaction access.        | One UoW per execution.            | Reuse rejection test.            | Test result.        |
| TX-10 | Long-running/non-DB work is not hidden inside repository. | Lock/resource exhaustion.        | Keep adapter methods bounded.     | Duration/flow review.            | Trace or review.    |

## Error Contracts (ERR)

| ID     | Rule                                                                | Risk                           | Enforce                         | Test                      | Evidence            |
| ------ | ------------------------------------------------------------------- | ------------------------------ | ------------------------------- | ------------------------- | ------------------- |
| ERR-01 | PostgreSQL mapping exists only at the UoW boundary.                 | Inconsistent failures.         | No adapter catch/map.           | Search and boundary test. | Search/test output. |
| ERR-02 | Known SQLSTATE maps to the established typed error.                 | Driver code leaks.             | Central mapping table.          | Real violation test.      | PostgreSQL result.  |
| ERR-03 | Unknown PostgreSQL integrity codes map predictably.                 | Unstable application handling. | Base persistence mapping.       | Unknown-23xxx unit test.  | Unit result.        |
| ERR-04 | Non-database errors preserve identity/type.                         | Programming errors masked.     | Re-throw unchanged.             | Sentinel error test.      | Unit result.        |
| ERR-05 | Repository not-found errors are distinct from DB constraint errors. | Wrong retry/handling.          | Typed persistence not-found.    | Missing-row test.         | Test result.        |
| ERR-06 | Port documents nullable versus throwing reads.                      | Caller guesses semantics.      | Explicit contract docs.         | Contract test.            | Port and test.      |
| ERR-07 | Error text never includes secret-bearing entity data.               | Information disclosure.        | Fixed messages.                 | Message scan.             | Test result.        |
| ERR-08 | Constraint names are diagnostic metadata, not business logic.       | DB naming leaks into policy.   | Application checks types/codes. | Boundary review.          | Handler test.       |
| ERR-09 | No duplicate SQLSTATE switch exists outside UoW.                    | Mapping drift.                 | Centralized mapper.             | Repository-wide search.   | Search output.      |
| ERR-10 | Error causes are preserved only when policy permits and safely.     | Lost diagnosis or data leak.   | Review cause-chain handling.    | Cause-chain test.         | Test result.        |

## Qualification Tests (TEST)

| ID      | Rule                                                     | Risk                         | Enforce                        | Test                        | Evidence                  |
| ------- | -------------------------------------------------------- | ---------------------------- | ------------------------------ | --------------------------- | ------------------------- |
| TEST-01 | Existing lookup reconstructs the expected aggregate.     | Broken reads.                | Real DB round-trip.            | Find existing.              | Test result.              |
| TEST-02 | Missing lookup returns the contracted result.            | Hidden not-found mismatch.   | Explicit null/error assertion. | Find missing.               | Test result.              |
| TEST-03 | Every alternate lookup predicate is covered.             | Wrong/missing query.         | One test per port query.       | Lookup matrix.              | Test result.              |
| TEST-04 | Valid insert is read back from PostgreSQL.               | False insert success.        | Real DB assertion.             | Insert/read.                | Test result.              |
| TEST-05 | Duplicate primary key reaches UoW mapping.               | Lost error translation.      | No mocked PG error.            | Duplicate-ID test.          | Error type/result.        |
| TEST-06 | Every UNIQUE invariant is tested through PostgreSQL.     | Race/constraint gap.         | Violate actual constraint.     | Duplicate business key.     | Error type/result.        |
| TEST-07 | Invalid FK is rejected by PostgreSQL.                    | Orphan rows.                 | Use non-existent parent.       | FK violation.               | Error type/result.        |
| TEST-08 | NOT NULL/CHECK constraints are tested where contractual. | Invalid persisted state.     | Attempt invalid row.           | Constraint test.            | Error type/result.        |
| TEST-09 | Existing update preserves immutable fields.              | Data corruption.             | Compare before/after.          | Update test.                | Test result.              |
| TEST-10 | Missing update follows frozen semantics.                 | Silent lost update.          | Assert typed result/error.     | Missing update.             | Test result.              |
| TEST-11 | Existing delete physically/logically follows contract.   | Residual credential/data.    | Re-read after delete.          | Delete existing.            | Test result.              |
| TEST-12 | Missing delete follows frozen semantics.                 | Idempotency ambiguity.       | Explicit assertion.            | Delete missing.             | Test result.              |
| TEST-13 | Mapper reconstructs without emitting events.             | Duplicate domain events.     | Check event state.             | Mapper reconstruction test. | Test result.              |
| TEST-14 | Transaction commit is externally observable.             | Hidden auto-commit.          | Read in new UoW.               | Commit test.                | PostgreSQL result.        |
| TEST-15 | Transaction rollback removes all writes.                 | Partial persistence.         | Throw after write.             | Rollback test.              | PostgreSQL result.        |
| TEST-16 | Inactive context fails before issuing SQL.               | Accidental autocommit.       | Use inactive context.          | Context guard test.         | Test result.              |
| TEST-17 | Separate UoWs do not share context/transaction.          | Cross-request contamination. | Independent UoWs.              | Isolation test.             | Test result.              |
| TEST-18 | Qualification matrix covers each logical contract case.  | Inflated pass count.         | Case-to-test traceability.     | Matrix review.              | Matrix and names.         |
| TEST-19 | DB integration tests require real configured PostgreSQL. | Fake confidence.             | Fail/mark blocked if absent.   | Run integration suite.      | URL presence and run log. |
| TEST-20 | Test setup cannot target a production database.          | Destructive test impact.     | Dedicated DB guard.            | Refuse unsafe target test.  | Guard output.             |

## Implementation Quality (CODE)

| ID      | Rule                                                             | Risk                              | Enforce                       | Test                      | Evidence       |
| ------- | ---------------------------------------------------------------- | --------------------------------- | ----------------------------- | ------------------------- | -------------- |
| CODE-01 | No dead imports or unreachable branches are added.               | Noise and defects.                | Lint.                         | Focused lint.             | Lint result.   |
| CODE-02 | No duplicated transaction or error-mapping logic is added.       | Divergent behavior.               | Search/review.                | Static search.            | Search output. |
| CODE-03 | Query ordering/limit is explicit where needed.                   | Nondeterministic result.          | Define deterministic query.   | Multi-row fixture.        | Test result.   |
| CODE-04 | Updates use affected-row evidence.                               | Silent missing update.            | `returning()` or equivalent.  | Missing update test.      | Query/test.    |
| CODE-05 | Deletes use affected-row evidence when strict.                   | Silent missing delete.            | `returning()` or equivalent.  | Missing delete test.      | Query/test.    |
| CODE-06 | Method behavior matches port, not convenience.                   | Contract drift.                   | Contract matrix review.       | Port tests.               | Matrix/result. |
| CODE-07 | Comments explain non-obvious constraints only.                   | Stale misleading docs.            | Review comments against code. | Documentation review.     | Diff review.   |
| CODE-08 | Async failures are awaited and propagated.                       | Unhandled DB errors.              | Await every query.            | Rejection test.           | Test result.   |
| CODE-09 | No fire-and-forget persistence operation is introduced.          | Lost writes.                      | Awaited API.                  | Static review.            | Source review. |
| CODE-10 | Repository does not mutate input aggregate.                      | Hidden state changes.             | Mapper returns row only.      | Before/after object test. | Test result.   |
| CODE-11 | Query selects only necessary row set.                            | Over-fetching/sensitive exposure. | Explicit predicates/limits.   | Query inspection.         | Query source.  |
| CODE-12 | Public methods and failures are documented at the port boundary. | Consumer ambiguity.               | Contract comments.            | Port review.              | Port source.   |

## Release Evidence (REL)

| ID     | Rule                                                 | Risk                           | Enforce                      | Test                    | Evidence              |
| ------ | ---------------------------------------------------- | ------------------------------ | ---------------------------- | ----------------------- | --------------------- |
| REL-01 | Focused unit tests pass.                             | Local regressions.             | Run relevant package suite.  | Vitest command.         | Full output/status.   |
| REL-02 | PostgreSQL suite status is explicit.                 | False qualification.           | PASS/BLOCKED distinction.    | Real integration run.   | DB run record.        |
| REL-03 | Relevant package typecheck passes.                   | Type contract break.           | Package script.              | Typecheck command.      | Exit status.          |
| REL-04 | Configured lint passes.                              | Style/bug regressions.         | Existing lint script.        | Focused lint.           | Exit status.          |
| REL-05 | Changed files pass formatter.                        | Inconsistent source.           | Prettier check.              | Formatter command.      | Exit status.          |
| REL-06 | Migration changes are tested on clean DB.            | Fresh deploy failure.          | Disposable test DB.          | Apply all migrations.   | Migration log.        |
| REL-07 | Migration changes are tested against prior DB state. | Upgrade failure/duplicate DDL. | Upgrade fixture.             | Forward migration test. | Upgrade log.          |
| REL-08 | All `NOT RUN` and `N/A` checks are disclosed.        | Overstated status.             | Final matrix.                | Report review.          | Qualification report. |
| REL-09 | Architecture changes are stated explicitly.          | Hidden boundary regression.    | Final architecture review.   | Dependency/test review. | Review record.        |
| REL-10 | Qualification claims cite reproducible evidence.     | Unverifiable approval.         | Link commands and artifacts. | Evidence audit.         | Final report.         |

## Credential-Specific Controls (CRED)

| ID      | Rule                                                | Risk                               | Enforce                    | Test                         | Evidence               |
| ------- | --------------------------------------------------- | ---------------------------------- | -------------------------- | ---------------------------- | ---------------------- |
| CRED-01 | Persist only the aggregate's pre-hashed value.      | Plaintext credential storage.      | Typed mapper input.        | Insert/read fixture.         | Mapper/test source.    |
| CRED-02 | Never introduce plaintext/password columns.         | Credential exposure.               | Schema diff gate.          | Schema scan.                 | DDL scan.              |
| CRED-03 | Never hash within repository/mapper.                | Crypto policy leakage.             | Layer boundary review.     | Static search.               | Search output.         |
| CRED-04 | Never log `hashedPassword`.                         | Offline cracking risk.             | Redaction/no entity dumps. | Captured logger test.        | Test output.           |
| CRED-05 | Never place hash in exception message/cause text.   | Error-channel disclosure.          | Generic errors.            | Error serialization test.    | Test result.           |
| CRED-06 | Never put hash in domain event payload.             | Event-store disclosure.            | Event allow-list.          | Event serialization scan.    | Test result.           |
| CRED-07 | Never return hash from unrelated application DTOs.  | Excess credential disclosure.      | Explicit response mapping. | DTO contract test.           | Test result.           |
| CRED-08 | Use synthetic hashes in integration fixtures.       | Reusable test secret.              | Test-data policy.          | Fixture review.              | Fixture source.        |
| CRED-09 | Verify updates preserve id/userId/createdAt.        | Credential reassignment/tampering. | Aggregate mapping.         | Before/after test.           | Test result.           |
| CRED-10 | Verify one-user uniqueness under concurrent insert. | Multiple credentials/race.         | DB UNIQUE(user_id).        | Parallel PostgreSQL inserts. | Constraint/run output. |

## Gate Result Record

For each implementation, retain a matrix with columns `Rule ID`, `Status`, `Evidence`, `Finding`, and `Waiver`. The repository is not qualified while any applicable rule is `FAIL`, any critical rule is `NOT RUN`, or PostgreSQL-required evidence is unavailable. Report architecture qualification separately from current-session replay; never convert owner-reported evidence into a test result observed in the current run.
