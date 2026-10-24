# PHASE 9.17.8 — MONO-01 Boundary Audit

Date: 2026-09-29

## Decision

**MONO-01 — FAIL**

**Enterprise readiness remains BLOCKED.** A green TypeScript/build result is not boundary or runtime proof. There are confirmed architectural leaks and functional/security defects in the current Magic Link composition. Existing DB-01..DB-15 and CONT-13..CONT-21 gates were not reopened; no new evidence in this audit contradicts CONT-21 = PASS.

## Scope And Evidence

`git diff --cached --name-only` reports exactly 55 staged paths; all 55 are under `modules/iam`. The worktree separately has 195 unstaged paths. Those unstaged paths include API, contracts, platform, generated-client, and earlier build/typecheck changes; they were inspected as the current integration surface but cannot be attributed to PHASE 9.17.5/9.17.6 from Git state alone. The complete ownership matrix below therefore covers the exact 55 staged files, while the integration findings explicitly identify current unstaged evidence.

Evidence gathered:

- Workspace manifest dependency edges and app `tsconfig` project references.
- Package exports/barrels, imports, current API composition, event and DI wiring.
- Static source scan: no module-to-module private infrastructure/presentation imports found; a separate scan reported zero relative TS import cycles among 1,140 TypeScript source files. This does not prove absence of runtime or external-package cycles.
- No architecture/dependency-boundary test file or CI boundary rule was found. CI runs lint, formatting, typecheck, migration checks, tests, app builds, and E2E; none enforces the forbidden dependency matrix.
- No runtime dynamic imports were found in the inspected API composition. Type-only `import()` references are not runtime loading.

## Dependency Graphs

These are workspace package-manifest edges (dependencies, devDependencies, and peerDependencies that resolve to workspace packages), not every third-party npm edge.

### Package Graph

```text
@workspace/kernel                  -> (none)
@workspace/contracts               -> @workspace/kernel
@workspace/platform-database       -> (none)
@workspace/platform-logger         -> (none)
@workspace/platform                -> @workspace/kernel, @workspace/platform-database, @workspace/platform-logger
@workspace/migration-runtime       -> @workspace/platform-database, @workspace/platform-logger
@workspace/platform-client         -> @workspace/contracts, @workspace/kernel, @workspace/ui
@workspace/test-utils              -> @workspace/contracts, @workspace/kernel
@workspace/scripts                 -> @workspace/migration-runtime, @workspace/platform-database, @workspace/platform-logger
```

Every business module except IAM has the same declared workspace dependencies:

```text
@workspace/access-control          -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/advertising             -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/analytics               -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/audit                   -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/billing                 -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/catalog                 -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/content                 -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/devices                 -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/features                -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/iam                     -> @workspace/contracts, @workspace/kernel, @workspace/platform,
                                      @workspace/platform-database, @workspace/platform-logger
@workspace/integrations            -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/media                   -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/notification            -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/reports                 -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/search                  -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/social                  -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/subscription            -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/tenant                  -> @workspace/contracts, @workspace/kernel, @workspace/platform
@workspace/viewing                 -> @workspace/contracts, @workspace/kernel, @workspace/platform
```

The module package `modules/admin` also declares `@workspace/contracts`, `@workspace/kernel`, and `@workspace/platform`. Its package name collided with the Admin app. This audit renamed it to `@workspace/admin-module`; duplicate-name scan now reports 43 manifests and 43 unique names.

### Module Graph

```text
access-control, advertising, analytics, audit, billing, catalog, content,
devices, features, integrations, media, notification, reports, search, social,
subscription, tenant, viewing -> contracts, kernel, platform
iam -> contracts, kernel, platform, platform-database, platform-logger
```

No declared module-to-module edge was found, and no source import from one module into another module's private infrastructure/presentation was found. However, all module manifests broadly depend on `@workspace/platform`; only source-layer analysis can establish whether those imports stay in infrastructure. No automated layer-specific enforcement currently exists. Package graph is acyclic for the workspace edges inspected.

### Application Graph

```text
@workspace/api      -> contracts, iam, kernel, platform, platform-database, platform-logger
@workspace/web      -> contracts, platform-client, ui
@workspace/admin    -> contracts, platform-client, ui
@workspace/mobile   -> contracts
@workspace/telegram -> contracts, kernel, platform
```

`apps/api/tsconfig.json` additionally references billing, tenant, notification, and audit projects although `apps/api/package.json` declares none of those workspace dependencies. These are project references, not observed runtime imports; manifest/build graph alignment is an assurance gap. `@workspace/api` imports the IAM root barrel, which currently re-exports handlers, controllers, providers, Drizzle repositories, and schema tables. Thus the package import is not a deep path, but the barrel exposes module internals as app-consumable API and bypasses the intended module boundary.

## Forbidden Dependency Scan

| Rule                                                                        | Result                               | Evidence / classification                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| module -> app                                                               | NOT VERIFIED                         | No source import found. No architecture test prevents a future edge.                                                                                                                                                                                                                    |
| domain -> Express / Drizzle / PostgreSQL / Redis / Telegram SDK / OAuth SDK | NOT VERIFIED                         | None found under IAM domain source. This scan does not prove every future change.                                                                                                                                                                                                       |
| domain -> platform cryptography                                             | CONFIRMED DEFECT                     | `modules/iam/src/domain/MagicLinkToken.ts` imports Node crypto and creates/hashes raw tokens in the domain entity. Crypto capability belongs behind a platform/application port per the supplied responsibility model.                                                                  |
| application -> concrete platform implementation                             | CONFIRMED DEFECT, PARTIALLY REPAIRED | Staged `MagicLinkConsumedEventHandler.ts` imported `@workspace/platform-logger`. This audit changed it to the existing `LoggerPort`. Other source layers still have no CI enforcement.                                                                                                  |
| module -> another module private infrastructure/presentation                | NOT VERIFIED                         | No source import found in static scan.                                                                                                                                                                                                                                                  |
| kernel -> platform                                                          | NOT VERIFIED                         | No workspace dependency/import found.                                                                                                                                                                                                                                                   |
| contracts -> concrete infrastructure                                        | NOT VERIFIED                         | Contracts depends on kernel only; no concrete implementation import found.                                                                                                                                                                                                              |
| API -> private module internals / barrel bypass                             | CONFIRMED DEFECT                     | API composition imports concrete IAM repositories, database schema, providers, and handlers from `@workspace/iam`; those implementations are exported by `modules/iam/src/index.ts`. A module-owned composition factory/public application API is needed.                               |
| duplicate identity business logic in apps                                   | NOT VERIFIED                         | No second canonical identity implementation found in inspected app source.                                                                                                                                                                                                              |
| module/app package-name ownership ambiguity                                 | CONFIRMED DEFECT, REPAIRED           | `apps/admin` and `modules/admin` both declared `@workspace/admin`; module is now `@workspace/admin-module`.                                                                                                                                                                             |
| module outbox implementation in wrong owner                                 | CONFIRMED DEFECT                     | `modules/iam/src/infrastructure/repositories/DrizzleOutboxRepository.ts` implements the generic platform `OutboxStore`, alongside platform dispatcher/interfaces. The persistence/dispatch capability is declared platform-owned, yet its concrete implementation/schema are IAM-owned. |
| dependency-boundary test/CI gate                                            | ASSURANCE GAP                        | No architecture test found; CI does not enforce package/layer allowlists.                                                                                                                                                                                                               |

The remaining external transitive npm dependency tree was not audited package-by-package. Workspace transitive reachability was derived from the workspace manifest graph above. MONO-01 cannot pass while any required boundary proof or concrete violation remains.

## Runtime And Responsibility Findings

### Magic Link

**CONFIRMED DEFECT:** `validateRequest` parses `{ body, query, params }`; the two Magic Link schemas describe flat `email/purpose` and `token/purpose` shapes, and the controller subsequently reads `req.validated.body`. A runtime schema reproduction with the middleware's wrapped shape rejects both requests because required fields are missing. Valid request payloads currently receive 422.

**CONFIRMED DEFECT:** `VerifyMagicLinkHandler.execute` verifies that token purpose equals submitted purpose, then unconditionally consumes the token and creates an authenticated session/access/refresh tokens. Consequently `password_reset`, `email_verification`, and `account_recovery` tokens all authenticate as login. Purpose matching is not purpose-specific authorization.

**CONFIRMED DEFECT:** token consumption precedes session persistence, token generation, and event publication; the handler has no shared transaction/UoW. Failure after consume strands a one-time token. The session is saved first with an empty refresh token and again after generation. The schema's refresh-token uniqueness can conflict for concurrent sessions that temporarily write the same empty value.

**CONFIRMED DEFECT:** the production Drizzle `consume(digest)` update checks only digest and `consumed_at IS NULL`; it does not atomically check expiration or purpose. The handler's earlier read/check can race with expiry. The in-memory adapter is stricter than production, and no PostgreSQL repository concurrency test exists.

**CONFIRMED DEFECT:** the API constructs `DrizzleOutboxRepository` but discards it, selects `InMemoryIamEventBus`, returns `outboxDispatcher: null`, and does not start a dispatcher. `IamEventSubscriber.subscribe()` is a no-op and is not instantiated. `bootstrap()` passes only the database URL; no email service is configured. The request handler's `MagicLinkRequestedEventHandler` is therefore not invoked and email is not delivered by normal API startup.

**CONFIRMED DEFECT:** event payload contains the raw token URL. The in-memory bus retains event objects in an array until cleared; no bounded retention/automatic cleanup exists. The current email handler avoids logging the URL, but storage in memory remains a bearer-secret exposure.

**CONFIRMED DEFECT:** `RateLimiter` accepts `(cache, windowMs, maxRequests)`, but API composition passes `(cache, 5, 60 * 1000)`, yielding a 5ms window and 60,000 requests. Bootstrap supplies no cache, so it is disabled in normal startup. An in-process MemoryCache would still not provide shared limits across replicas.

**CONFIRMED CONTRACT DEFECT:** `packages/contracts/src/iam/auth/MagicLinkRequest.ts` accepts only `email`, whereas the route's local validator requires `email` and `purpose` and optionally accepts `redirectUrl`. A consumer using the stable contract can construct a request the route rejects.

**ASSURANCE GAP:** successful verification resolves `token.userId` (the canonical user ID embedded at issuance) but does not reload/verify the canonical user at consumption. ActorContext is created with a synthetic request ID and then unused; no actor/session/device/correlation is attached to the consumed event or durably audited. Device headers are caller-controlled metadata stored in the session, not registered/trusted device identity. IP and user-agent are captured as session attributes, but privacy, retention, and redaction controls were not demonstrated.

### Security, Audit, Outbox, Identity

- `AuditEvent`, `SecurityEvent`, and `OutboxEvent` are application-level types/builders; static usage scan found no runtime producers/consumers outside their own declarations/barrels. No append-only audit persistence, transactionally linked security-event write, or audit redaction runtime was found. Audit and Security Events = **FAIL**.
- IAM has its own `iam_outbox_events` schema/repository while platform already owns `OutboxStore`, `OutboxEventBus`, and `OutboxEventDispatcher`. The implementation is unused by the current container. This is both a responsibility leak and a runtime durability failure; do not add another event table/dispatcher.
- OAuth providers are concrete adapters behind the IAM `OAuthProvider` abstraction; no provider-specific canonical User model was found. Provider-neutral identity is **INCONCLUSIVE** because account-link ownership checks lack a demonstrated step-up/transaction boundary and no comprehensive provider conformance suite was run.
- Session security = **FAIL**: logout revocation is not persisted by the Drizzle session adapter/schema; refresh-token storage is direct; authentication cookies are used while some tests/contracts still expect body token fields.
- Account linking = **FAIL**: no demonstrated step-up authentication or atomic ownership-check/insert; provider state/PKCE proof for link flow is incomplete.
- Authorization: ABAC has unit evidence for deny override/default deny; RBAC/permission API tests have a failing role assignment case. Tenant isolation and object/property-level authorization were not demonstrated in API routes. UBAC is not verified.
- MFA and password/identity recovery: **BLOCKED**; no complete runtime flow found. Magic-link purpose enums alone do not implement them.
- Analytics module remains a skeleton; notification providers exist but the API does not wire magic-link notification delivery.

## Changed-File Ownership Matrix — 55 Staged Files

All 55 staged files belong to the `modules/iam` bounded capability. `Local IAM` means imports within IAM's own layer/module; `Kernel` means provider-neutral `@workspace/kernel`; `Node crypto` means runtime cryptography. Evidence applies to current source; where an audit repair changed an import, that is noted.

| File                                                                                           | Owner / layer                 | Responsibility                   | Dependency delta                 | Boundary status / evidence                                                                          |
| ---------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `modules/iam/src/application/commands/assign-role/AssignRoleCommand.ts`                        | IAM / application             | Role-assignment input            | Local IAM                        | Correct owner; actor attribution contract remains incomplete.                                       |
| `modules/iam/src/application/commands/assign-role/AssignRoleHandler.ts`                        | IAM / application             | Orchestrate role assignment      | Local IAM ports/domain           | Correct owner; no durable audit event is emitted.                                                   |
| `modules/iam/src/application/commands/index.ts`                                                | IAM / application API         | Command exports                  | Local IAM                        | Barrel is module-internal; public root overexposes internals.                                       |
| `modules/iam/src/application/commands/logout-user/LogoutUserCommand.ts`                        | IAM / application             | Logout input                     | Local IAM                        | Correct owner.                                                                                      |
| `modules/iam/src/application/commands/logout-user/LogoutUserHandler.ts`                        | IAM / application             | Revoke/logout workflow           | Local IAM                        | Correct owner; persistence revocation defect remains.                                               |
| `modules/iam/src/application/commands/register-user/RegisterUserHandler.ts`                    | IAM / application             | Registration orchestration       | Local IAM + Kernel event         | Correct owner; event durability is not proven.                                                      |
| `modules/iam/src/application/commands/send-magic-link/SendMagicLinkCommand.ts`                 | IAM / application             | Request DTO                      | Local IAM                        | Correct owner; request purpose contract mismatch remains.                                           |
| `modules/iam/src/application/commands/send-magic-link/SendMagicLinkHandler.ts`                 | IAM / application             | Issue token and request delivery | IAM domain/ports                 | Correct owner; raw link is published to in-memory bus and never delivered in API composition.       |
| `modules/iam/src/application/commands/send-magic-link/index.ts`                                | IAM / application             | Local command exports            | Local IAM                        | Correct internal barrel.                                                                            |
| `modules/iam/src/application/commands/verify-magic-link/VerifyMagicLinkCommand.ts`             | IAM / application             | Verification input               | Local IAM                        | Correct owner; accepts metadata from HTTP.                                                          |
| `modules/iam/src/application/commands/verify-magic-link/VerifyMagicLinkHandler.ts`             | IAM / application             | Consume token and authenticate   | Local IAM + Kernel + Node crypto | Purpose escalation and missing transaction are CONFIRMED DEFECTS.                                   |
| `modules/iam/src/application/commands/verify-magic-link/index.ts`                              | IAM / application             | Local command exports            | Local IAM                        | Correct internal barrel.                                                                            |
| `modules/iam/src/application/commands/verify-magic-link/verify-magic-link.concurrency.test.ts` | IAM / test                    | Concurrent consumption test      | Vitest + IAM in-memory adapters  | Test only proves in-memory behavior, not PostgreSQL.                                                |
| `modules/iam/src/application/commands/verify-magic-link/verify-magic-link.expiration.test.ts`  | IAM / test                    | Expiration/purpose tests         | Vitest + IAM in-memory adapters  | It currently asserts reset and email-verification tokens also succeed as sessions; confirms defect. |
| `modules/iam/src/application/commands/verify-magic-link/verify-magic-link.failure.test.ts`     | IAM / test                    | Failure injection                | Vitest + IAM in-memory adapters  | Does not prove rollback; consume failure mock rejects before mutation.                              |
| `modules/iam/src/application/commands/verify-magic-link/verify-magic-link.replay.test.ts`      | IAM / test                    | Replay protection                | Vitest + IAM in-memory adapters  | In-memory-only evidence.                                                                            |
| `modules/iam/src/application/context/ActorContext.ts`                                          | IAM / application contract    | Actor attribution                | Local IAM                        | Appropriate IAM concept; not promoted to stable contracts and not propagated in runtime flow.       |
| `modules/iam/src/application/context/DeviceContext.ts`                                         | IAM / application contract    | Device metadata/trust shape      | Local IAM                        | Appropriate concept; no device registration/persistence runtime found.                              |
| `modules/iam/src/application/context/RequestContext.ts`                                        | IAM / application             | Request/correlation context      | Local IAM + Node crypto          | Defined but not wired end-to-end; generated request ID does not correlate with HTTP request.        |
| `modules/iam/src/application/context/index.ts`                                                 | IAM / application API         | Context exports                  | Local IAM                        | Correct internal barrel; not a cross-boundary contract.                                             |
| `modules/iam/src/application/events/AuditEvent.ts`                                             | IAM / application event model | Audit taxonomy/payload           | Local context + Node crypto      | No durable producer/store; duplicate `ChangedField` declaration also merits cleanup.                |
| `modules/iam/src/application/events/OutboxEvent.ts`                                            | IAM / application event model | Context-enriched outbox envelope | Local context + Node crypto      | Unused and separate from platform `OutboxMessage`; outbox ownership mismatch.                       |
| `modules/iam/src/application/events/SecurityEvent.ts`                                          | IAM / application event model | Security taxonomy/payload        | Local context + Node crypto      | No runtime producers/persistence found.                                                             |
| `modules/iam/src/application/events/handlers/MagicLinkConsumedEventHandler.ts`                 | IAM / application             | Log consumption event            | LoggerPort (audit repair)        | Fixed layer leak: now depends on IAM port, not platform Logger type.                                |
| `modules/iam/src/application/events/handlers/MagicLinkRequestedEventHandler.ts`                | IAM / application             | Deliver magic-link email         | IAM EmailSenderPort/LoggerPort   | Correct port direction; API never subscribes/invokes it.                                            |
| `modules/iam/src/application/events/handlers/UserRegisteredEventHandler.ts`                    | IAM / application             | Handle registration event        | IAM ports/domain                 | Correct owner; runtime durability/registration is unverified.                                       |
| `modules/iam/src/application/events/subscribers/IamEventSubscriber.ts`                         | IAM / application composition | Register typed event handlers    | IAM ports/handlers               | `subscribe()` is a no-op; event chain is not connected.                                             |
| `modules/iam/src/application/index.ts`                                                         | IAM / application API         | Application exports              | Local IAM                        | Internal barrel; root export policy too broad.                                                      |
| `modules/iam/src/application/ports/ApplicationError.ts`                                        | IAM / application contract    | Use-case errors                  | Kernel/local IAM                 | Correct owner.                                                                                      |
| `modules/iam/src/application/security/RateLimiter.ts`                                          | IAM / application             | Rate-limit policy via cache port | Local CachePort                  | Port ownership is correct; API constructor arguments are reversed/cache absent.                     |
| `modules/iam/src/application/security/index.ts`                                                | IAM / application API         | Security exports                 | Local IAM                        | Correct internal barrel.                                                                            |
| `modules/iam/src/domain/MagicLinkToken.ts`                                                     | IAM / domain                  | Token invariant/value state      | Node crypto + UserId             | Domain performs platform cryptography directly; CONFIRMED boundary defect.                          |
| `modules/iam/src/domain/events/MagicLinkConsumedEvent.ts`                                      | IAM / domain                  | Token-consumed domain event      | Kernel + IAM domain              | Correct local domain event; not equivalent to durable Security/Audit event.                         |
| `modules/iam/src/domain/events/MagicLinkRequestedEvent.ts`                                     | IAM / domain                  | Token-requested domain event     | Kernel + IAM domain              | Correct local domain event; payload carries raw bearer URL.                                         |
| `modules/iam/src/domain/index.ts`                                                              | IAM / domain API              | Domain exports                   | Local IAM                        | Correct internal barrel.                                                                            |
| `modules/iam/src/domain/repositories/MagicLinkTokenRepository.ts`                              | IAM / domain port             | Token persistence contract       | IAM domain                       | Correct port ownership; consume signature cannot enforce purpose/expiry atomically.                 |
| `modules/iam/src/domain/repositories/SessionRepository.ts`                                     | IAM / domain port             | Session persistence contract     | IAM domain                       | Correct port ownership; no transactional combined operation.                                        |
| `modules/iam/src/domain/repositories/index.ts`                                                 | IAM / domain API              | Repository port exports          | Local IAM                        | Correct internal barrel.                                                                            |
| `modules/iam/src/index.ts`                                                                     | IAM / public package API      | Exports composition surface      | Crosses all IAM layers           | CONFIRMED boundary defect: exports concrete repositories/schema/provider adapters/controllers.      |
| `modules/iam/src/infrastructure/cache/MemorySessionCache.ts`                                   | IAM / infrastructure          | Cache adapter                    | Platform cache                   | Correct adapter layer; current implementation works with CachePort.                                 |
| `modules/iam/src/infrastructure/cache/RedisSessionCache.ts`                                    | IAM / infrastructure          | Redis session cache adapter      | ioredis + IAM                    | Infrastructure placement is appropriate; production cache path not proven in API.                   |
| `modules/iam/src/infrastructure/database/migrations/0013_magic_link_tokens.sql`                | IAM / infrastructure          | Token table/index migration      | PostgreSQL SQL                   | Correct persistence owner; migration guardrail exists, runtime DB integration absent.               |
| `modules/iam/src/infrastructure/database/relations/index.ts`                                   | IAM / infrastructure          | Drizzle relations                | Drizzle + IAM schema             | Correct owner.                                                                                      |
| `modules/iam/src/infrastructure/database/schema/magic_link_tokens.table.ts`                    | IAM / infrastructure          | Token persistence schema         | Drizzle + IAM domain enum        | Correct owner; schema is re-exported to app composition.                                            |
| `modules/iam/src/infrastructure/index.ts`                                                      | IAM / infrastructure API      | Infrastructure exports           | Local IAM/Drizzle                | Correct internal barrel; public IAM root exposes it.                                                |
| `modules/iam/src/infrastructure/repositories/DrizzleMagicLinkTokenRepository.ts`               | IAM / infrastructure          | PostgreSQL token adapter         | Drizzle + IAM domain             | Correct adapter owner; expiry/purpose missing in conditional consume.                               |
| `modules/iam/src/infrastructure/repositories/DrizzleSessionRepository.ts`                      | IAM / infrastructure          | PostgreSQL session adapter       | Drizzle + IAM domain             | Correct adapter owner; revocation persistence/session transaction needs verification.               |
| `modules/iam/src/infrastructure/repositories/InMemoryMagicLinkTokenRepository.ts`              | IAM / test/development infra  | In-memory token adapter          | IAM domain                       | Correct test adapter; cannot establish production race guarantees.                                  |
| `modules/iam/src/infrastructure/repositories/InMemorySessionRepository.ts`                     | IAM / test/development infra  | In-memory session adapter        | IAM domain                       | Correct test adapter; cannot prove DB transaction semantics.                                        |
| `modules/iam/src/presentation/http/controllers/AuthController.ts`                              | IAM / presentation            | HTTP auth/Magic Link endpoints   | Express + IAM application        | Correct module presentation owner; schema envelope mismatch makes valid requests fail.              |
| `modules/iam/src/presentation/http/controllers/OAuthController.ts`                             | IAM / presentation            | OAuth transport                  | Express + IAM application        | Correct owner; current API test fixtures fail three callback/state cases.                           |
| `modules/iam/src/presentation/http/controllers/UserController.ts`                              | IAM / presentation            | User HTTP routes                 | Express + IAM application        | Correct owner; object/property authorization not demonstrated.                                      |
| `modules/iam/src/presentation/http/validators/auth/SendMagicLinkValidator.ts`                  | IAM / presentation            | Send request validation          | Zod                              | Correct transport validation owner; shape incompatible with middleware and shared contract.         |
| `modules/iam/src/presentation/http/validators/auth/VerifyMagicLinkValidator.ts`                | IAM / presentation            | Verify request validation        | Zod                              | Correct transport validation owner; shape incompatible with middleware.                             |
| `modules/iam/src/presentation/http/validators/auth/index.ts`                                   | IAM / presentation API        | Validator exports                | Local IAM                        | Correct internal barrel.                                                                            |

## Build And Test Verification

| Check                                                                         | Result                  | What it proves / does not prove                                                                                                                                                    |
| ----------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run typecheck`                                                          | PASS                    | All workspace TypeScript packages compiled at the time run; does not prove boundaries/runtime.                                                                                     |
| `pnpm run build`                                                              | PASS                    | Root build completed, including API bundle; Web/Admin build scripts explicitly print “Skipping … placeholder app.”                                                                 |
| `pnpm --filter @workspace/iam run typecheck`                                  | PASS                    | IAM current source typechecks.                                                                                                                                                     |
| `pnpm --filter @workspace/api exec tsc -p tsconfig.json --noEmit`             | PASS                    | API current source typechecks.                                                                                                                                                     |
| `pnpm exec vitest run modules/iam/src/application/commands/verify-magic-link` | PASS: 4 files, 30 tests | All use in-memory adapters; no production DB/controller/event wiring proof. Tests currently assert non-login purposes succeed.                                                     |
| `pnpm --filter @workspace/api test`                                           | FAIL: 13 pass, 5 fail   | One integration suite aborts because `DATABASE_URL` is unset; role assignment assertion fails; three OAuth security route cases return errors due current router/fixture mismatch. |
| Magic Link validator runtime reproduction                                     | FAIL                    | Both correct wrapped payloads rejected by current flat schemas; confirms valid endpoint requests produce validation failure.                                                       |
| Architecture boundary tests                                                   | NOT VERIFIED            | None found; tests cannot currently enforce the prohibited paths.                                                                                                                   |
| PostgreSQL Magic Link concurrency/failure integration                         | NOT VERIFIED            | No database-backed repository test run; no `DATABASE_URL` supplied.                                                                                                                |

## Capability Gates

| Gate                  | Status       | Evidence summary                                                                                            |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------------------- |
| Identity Architecture | INCONCLUSIVE | Canonical User/provider identity code exists; full cross-provider resolution/account invariants not proven. |
| Authentication        | INCONCLUSIVE | Password/OAuth runtime exists; API test failures and Magic Link route mismatch remain.                      |
| Session Security      | FAIL         | Revocation persistence gap, raw refresh-token storage, two-save/session transaction concerns.               |
| Account Linking       | FAIL         | No demonstrated step-up; ownership check/insert atomicity and link-state proof incomplete.                  |
| Magic Link            | FAIL         | Request schemas reject valid payloads; all purposes mint sessions; no email/outbox wiring; transaction gap. |
| MFA                   | BLOCKED      | No end-to-end runtime workflow found.                                                                       |
| Recovery              | BLOCKED      | Reset/recovery purpose values exist, but complete use cases do not.                                         |
| Authorization         | INCONCLUSIVE | Central policy code exists; runtime route coverage is incomplete.                                           |
| RBAC                  | INCONCLUSIVE | Role/permission code exists; one API role-assignment test fails.                                            |
| ABAC                  | PASS         | Unit tests exercise deny override and default deny; this does not prove API object-level coverage.          |
| UBAC                  | NOT VERIFIED | No separate direct user grant capability/tests established.                                                 |
| Permissions           | INCONCLUSIVE | Permission checks exist; resource/property enforcement not demonstrated.                                    |
| Tenant Isolation      | FAIL         | No end-to-end tenant-scoped authorization proof in current API routes.                                      |
| Audit                 | FAIL         | Event definitions without durable append-only persistence or runtime emission.                              |
| Security Events       | FAIL         | Taxonomy exists without runtime persistence/consumer chain.                                                 |
| Analytics             | BLOCKED      | Analytics module is a skeleton; no event pipeline proof.                                                    |
| Notifications         | INCONCLUSIVE | Platform providers exist; current API does not configure/dispatch Magic Link email.                         |
| Outbox                | FAIL         | IAM Drizzle store is unused; in-memory bus is active; dispatcher is null/not started.                       |
| Observability         | INCONCLUSIVE | Request logging/health exists; correlation across DB/event/audit/outbox is not proven.                      |
| Runtime               | FAIL         | Magic Link request is rejected and notification/outbox chain is disconnected.                               |
| Platform              | INCONCLUSIVE | Platform components exist and build; integrated production graph is not verified.                           |

## Repairs Made During This Audit

- Renamed `modules/admin` package to `@workspace/admin-module` to remove its collision with the Admin application. Duplicate scan now reports 43 unique names for 43 manifests.
- Changed `MagicLinkConsumedEventHandler` from the concrete platform `Logger` type to the existing IAM `LoggerPort`.
- `pnpm --filter @workspace/admin-module run typecheck` and `pnpm --filter @workspace/iam run typecheck` both pass after these changes.

No source files were changed to suppress the Magic Link failures or make MONO-01 appear green. The remaining gate needs architectural implementation and runtime proof, not additional barrel/typecheck workarounds.
