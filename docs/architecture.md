# IdentityPlatform — Architecture v1.0 (FROZEN)

Source of truth for the monorepo layout and dependency rules. Original
Uzbek-language decision docs are kept in `attached_assets/` for reference;
this file is the durable, living copy those decisions were extracted into.
Any change here requires an explicit architecture-review decision — this is
not a place to casually restructure.

## 1. Composition roots vs. business logic

- `apps/*` are **composition roots only** — HTTP routes (`api`), pages
  (`web`, `admin`), bot handlers (`telegram`). They wire modules together;
  they never contain business logic.
- `modules/*` hold all business logic, one per bounded context (`iam`,
  `billing`, `tenant`, `notification`, `audit`, 20+ more planned), each
  laid out as domain / application / infrastructure / presentation.
- Clients call `apps/api` → `modules/*`. Nothing calls a module directly.

## 2. Identity-First (not Identity-Centric)

- `modules/iam` is the **first module built**, not the center of the
  system. It owns authentication, authorization (roles/permissions), user
  management, sessions, and profile — nothing else.
- Other modules never import IAM's domain objects (e.g. no
  `import { User } from '../../iam/domain/User'`). They only ever hold a
  `userId: string` and resolve details via a join/query at the
  infrastructure layer, never via a shared aggregate.
- Social login / SSO (OAuth, SAML, OIDC, LDAP) is added later purely inside
  `modules/iam` via a Strategy pattern (`application/strategies/*`) — it
  does not change any other module's contract.

## 3. Module isolation (strict)

Modules never depend on each other directly — not even through `contracts`.
The module-level dependency matrix is the identity matrix: every module may
depend on itself, nothing else.

| Module | iam | billing | tenant | notification | audit | (all others) |
|---|---|---|---|---|---|---|
| any module | ✅ (self only) | ❌ | ❌ | ❌ | ❌ | ❌ |

- Cross-module communication happens only via **Event / Command / Query**
  (published on `packages/platform`'s messaging bus) — never a direct
  import of another module's package.
- **Why:** prevents the "Identity-Centric" trap (§2) from creeping back in
  through the back door — a module importing another module's contracts
  package is still a compile-time coupling, so it's banned too. This keeps
  every module independently extractable into its own service later without
  a rewrite.
- **Promotion rule:** if the same code is duplicated across 3+ modules, it's
  a sign the code belongs in `packages/*` (technical) or a shared event
  contract in `packages/contracts/events`, not copy-pasted per module.

## 4. Package dependency matrix

| Package | kernel | contracts | platform | ui | tooling |
|---|---|---|---|---|---|
| `ui` | ✅ | ❌ | ❌ | — | ❌ |
| `platform` (backend) | ✅ | ✅ | — | ❌ | ❌ |
| `platform/client` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `modules/*` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `apps/*` | ✅ | ✅ | ✅ | ✅ | ✅ |

- `kernel` has zero dependencies (DDD building blocks only).
- `contracts` depends only on `kernel` (DTOs/types, no implementation).
- No package may introduce a generic `utils/`, `common/`, or `shared/`
  dumping ground — capabilities live in the package/module they belong to.

## 5. Capability → implementation map

| Capability | Backend (`packages/platform`) | Frontend (`packages/platform/client`) |
|---|---|---|
| HTTP | `server/` (Express) | `http/` (ky) |
| Logging / Analytics | `logger/` (pino) | `analytics/` |
| Config / Theme | `config/` | `theme/` |
| Storage | `storage/` (S3) | `storage/` (localStorage/IndexedDB) |
| Cache / Server state | `cache/` (Redis) | `query/` (TanStack Query) |
| Security / Auth | `security/` (JWT issuer) | `auth/` (JWT consumer) |
| Validation | `validation/` (Zod) | `forms/` (TanStack Form + Zod) |
| Database | `database/` (Drizzle) | — |
| Messaging | `messaging/` | `notifications/` |
| Observability | `observability/` (OpenTelemetry) | `analytics/` |
| Routing | `server/` route mounting | `router/` (TanStack Router) |
| State | — | `state/` (Zustand) |
| Tables / lists | — | `table/` / `virtual/` (TanStack) |
| Scheduling | `scheduler/` | `browser/` |
| Locking | `locking/` | — |
| Cookies | — | `cookies/` |

`platform/client` is its own workspace package (`@workspace/platform-client`,
at `packages/platform/client`) so browser bundles never pull in backend-only
native deps (pg, ioredis, argon2, etc.) from `@workspace/platform`.

## 6. Frontend Technology Decision Registry (TDR)

| Capability | Chosen | Rejected alternatives | Why |
|---|---|---|---|
| HTTP client | ky | axios, fetch | Smaller, better API |
| Server state | TanStack Query | SWR, RTK Query | Best devtools/caching |
| Routing | TanStack Router | React Router | Type-safe, fast |
| Forms | TanStack Form | React Hook Form | Type-safe, reactive |
| Tables | TanStack Table | ag-Grid | Headless, flexible |
| Virtualization | TanStack Virtual | react-window | Performance |
| Client state | Zustand | Redux, Jotai | Simple, performant |
| Styling | Tailwind CSS | CSS Modules | Utility-first |
| UI components | shadcn/ui | MUI, Radix (raw) | Unstyled, accessible |
| Icons | Lucide | Font Awesome | Modern, consistent |
| Animation | Motion/Framer Motion | — | Modern API |

`apps/web` and `apps/admin` must not add these libraries directly —
depend on `@workspace/platform-client` instead, which owns the versions.

## 7. `packages/ui` — UI only

`packages/ui` holds `components/`, `primitives/` (headless), `icons/`,
`layouts/`, `styles/`, `accessibility/`, `types/`, and `utils/` (only
`cn.ts`, `composeRefs.ts`, `slot.ts`). Hooks, constants, formatting, and
validation helpers belong in `platform/client`, not here.

## 8. Frontend feature modules (`apps/web`, `apps/admin`)

Each app organizes feature areas under `src/modules/<feature>/`:
`api/` (endpoint calls), `hooks/`, `components/`, `store/`, `types/`,
`utils/`. `src/pages/` stays thin — it composes modules for routing only.
No app-root `hooks/`, `stores/`, `types/`, or `utils/` catch-alls.

## 9. Module list & API roadmap (`/api/v1`)

`apps/api` versions all business routes under `/api/v1/<domain>`. Each
domain is owned by exactly one module (§3 — never split across modules):

| Domain(s) | Owning module | Status |
|---|---|---|
| identity, auth, users | `iam` | scaffolded (Identity-First, §2) |
| billing | `billing` | scaffolded |
| subscriptions | `subscription` | scaffolded |
| tenant | `tenant` | scaffolded |
| notifications | `notification` | scaffolded |
| audit | `audit` | scaffolded |
| catalog | `catalog` | scaffolded |
| content | `content` | scaffolded |
| viewing | `viewing` | scaffolded |
| media | `media` | scaffolded |
| search | `search` | scaffolded |
| analytics | `analytics` | scaffolded |
| access-control | `access-control` | scaffolded |
| features | `features` | scaffolded |
| devices | `devices` | scaffolded |
| integrations | `integrations` | scaffolded |
| advertising | `advertising` | scaffolded |
| social | `social` | scaffolded |
| admin | `admin` | scaffolded |
| reports | `reports` | scaffolded |
| platform, system (health/metrics/version/config) | *(none — lives in `apps/api` directly)* | implemented (`apps/api/src/health.ts`) |

- "scaffolded" = the module exists with the standard hexagonal skeleton
  (`domain/application/infrastructure/presentation`, empty) and a
  `packages/contracts/src/<domain>` stub — no business logic yet.
- `platform`/`system` endpoints (health, readiness, metrics, version) are
  technical, not business capabilities, so they're implemented directly in
  the `apps/api` composition root rather than as a module — consistent
  with golden rule #1 (business → modules, technical → packages/apps).
- `access-control` is a platform-wide RBAC/policy module (roles, permissions,
  policies as first-class resources across all modules) — distinct from
  `iam`'s own login-time role/permission checks, which stay in `iam` per
  Identity-First (§2).
- Roughly ~548 endpoints are planned across these domains long-term; only
  the scaffold exists today. Fill in one module at a time, following its
  own domain/application/infrastructure/presentation layers.

## 10. Status

This is the frozen v1.0 architecture. Every package/module currently
matches this shape as an empty scaffold (stub files only) — business logic
inside `modules/*`, `packages/contracts`, and most of `packages/platform`
is intentionally deferred until each capability is actually built.
