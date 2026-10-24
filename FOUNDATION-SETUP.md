# Foundation Setup Guide

This project is a **foundation template** for building enterprise-grade SaaS platforms with Identity, Tenant, and Access Control modules.

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/mynameinkhan555-dev/MyNewProj.git your-project-name
cd your-project-name
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/your_database

# Environment
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-in-production

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api

# Sentry Error Tracking (optional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Feature Flags
USE_IDENTITY=true
USE_TENANT=true
USE_AUTHORIZATION=true
```

### 4. Setup Database

#### Option A: PostgreSQL (Recommended)

```bash
# Create database
createdb your_database

# Run migrations
cd packages/platform-database
npx tsx scripts/apply-migrations.js
```

#### Option B: Supabase

1. Create a new Supabase project
2. Get your connection string from Project Settings → Database
3. Update `DATABASE_URL` in `.env`
4. Run migrations via Supabase SQL Editor or the script

### 5. Run Development Server

```bash
# API Server
cd apps/api
pnpm dev

# Admin Dashboard (if available)
cd apps/admin
pnpm dev

# Web App (if available)
cd apps/web
pnpm dev
```

## Project Structure

```
apps/
├── api/                    # REST API server
├── admin/                  # Admin dashboard
└── web/                    # Web application

modules/
├── identity/               # Identity module (User, EmailIdentity, PasswordCredential)
├── tenant/                 # Tenant module (Tenant, Membership, Invitations)
├── access-control/         # Access control module (Permissions, Roles, RBAC)
└── iam/                    # Legacy IAM module (phase-out in progress)

packages/
├── kernel/                 # Shared domain primitives (ID, Clock, AggregateRoot)
├── platform/               # Platform utilities (Security, Cache, Locking)
├── platform-database/      # Database abstraction (Drizzle, UnitOfWork)
├── platform-logger/        # Logging abstraction
├── contracts/              # Shared API contracts/DTOs
└── migration-runtime/      # Migration runtime utilities
```

## Architecture

### Bounded Contexts

- **Identity:** Canonical User aggregate, authentication identities
- **Tenant:** Companies, memberships, invitations
- **Access-Control:** Permissions, roles, role assignments
- **IAM:** Legacy (excluded from active path)

### Key Concepts

- **Global User:** `User` aggregate is canonical and global
- **Tenant Membership:** `UserTenantMembership` links users to tenants
- **Tenant Context:** Explicit tenant selection per request
- **JWT Claims:** Tokens include optional `tenantId` for tenant-scoped operations

### Database Isolation

PostgreSQL Row-Level Security (RLS) is used for tenant isolation:

- SQL files: `modules/tenant/drizzle/0000_create_user_tenant_memberships.sql`, `0001_enable_rls.sql`
- Apply manually via Supabase SQL Editor or migration script
- Tenant context: `modules/tenant/src/infrastructure/persistence/drizzle/tenant-context.ts`

## Testing

```bash
# Run all tests
pnpm test

# Run specific module tests
cd modules/identity
pnpm test

cd modules/tenant
pnpm test

# Run integration tests
cd modules/identity
pnpm test:integration

cd modules/tenant
pnpm test:integration
```

## Building

```bash
# Build all modules
pnpm build

# Build specific module
cd modules/identity
pnpm build
```

## Typechecking

```bash
# Typecheck all modules
pnpm typecheck

# Typecheck specific module
cd apps/api
pnpm typecheck
```

## Security Features

- **JWT Authentication:** With optional tenantId claim
- **Password Hashing:** Bcrypt
- **Rate Limiting:** express-rate-limit
- **Input Sanitization:** Zod validation
- **Security Headers:** Helmet
- **CORS:** Configured

## Observability

- **Structured Logging:** Pino with ISO timestamps
- **Error Tracking:** Sentry (configure DSN in .env)
- **Metrics:** Prometheus (exposed at /metrics)
- **Audit Logging:** Framework implemented
- **Health Checks:** /health, /ready endpoints

## Production Readiness

Critical steps before production deployment:

1. **Apply PostgreSQL RLS:**
   - Execute SQL files via Supabase SQL Editor
   - Verify tenant isolation policies

2. **Configure Sentry:**
   - Add SENTRY_DSN to production environment
   - Enable error tracking

3. **Enable Feature Flags:**
   - Set USE_IDENTITY=true
   - Set USE_TENANT=true
   - Set USE_AUTHORIZATION=true

4. **Secure Secrets:**
   - Rotate JWT_SECRET
   - Use environment-specific secrets
   - Never commit secrets to git

## Migration from IAM to Identity

This foundation includes both legacy IAM and new Identity modules. To migrate:

1. Start using Identity module (Identity → Tenant → Access-Control)
2. IAM is excluded from active API path
3. Gradually migrate features
4. Eventually deprecate IAM module

See `COMPREHENSIVE-PROJECT-AUDIT.md` for detailed migration strategy.

## API Documentation

See `apps/api/API-DOCUMENTATION.md` for complete API reference.

## Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- For Supabase, verify connection string format

### Build Errors

- Run `pnpm install` to ensure dependencies are up to date
- Check TypeScript version: `pnpm exec tsc --version`
- Clear node_modules: `rm -rf node_modules && pnpm install`

### Test Failures

- Ensure database is accessible
- Check .env configuration
- Run migrations if schema is out of date

## Support

For issues or questions, refer to:
- Architecture: `COMPREHENSIVE-PROJECT-AUDIT.md`
- API: `apps/api/API-DOCUMENTATION.md`
- Database: `PHASE-3-DATABASE-DESIGN.md`

## License

Proprietary - All rights reserved.
