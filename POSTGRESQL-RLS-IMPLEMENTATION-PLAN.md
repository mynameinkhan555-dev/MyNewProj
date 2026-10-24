# POSTGRESQL RLS IMPLEMENTATION PLAN

## Overview

PostgreSQL Row-Level Security (RLS) is required for tenant isolation at the database level. This ensures that even if application-level isolation fails, the database enforces tenant boundaries.

## Current State

- ❌ No Drizzle migrations setup
- ❌ No RLS policies defined
- ❌ No tenant context in database queries

## Implementation Steps

### Phase 1: Drizzle Migrations Setup

1. **Install Drizzle Kit for migrations**
   ```bash
   pnpm add -D drizzle-kit
   ```

2. **Configure drizzle.config.ts**
   ```typescript
   import { defineConfig } from 'drizzle-kit';

   export default defineConfig({
     schema: './src/infrastructure/persistence/drizzle/schema',
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: {
       url: process.env.DATABASE_URL,
     },
   });
   ```

3. **Create initial migration**
   ```bash
   pnpm drizzle-kit generate
   ```

### Phase 2: RLS Policy Definition

1. **Enable RLS on tenant tables**
   ```sql
   ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
   ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
   ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tenant_roles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
   ```

2. **Create tenant_id column function**
   ```sql
   CREATE OR REPLACE FUNCTION app.current_tenant_id()
   RETURNS bigint AS $$
     SELECT NULL::bigint;
   $$ LANGUAGE sql STABLE;
   ```

3. **Create RLS policies**
   ```sql
   -- Tenants table
   CREATE POLICY tenant_isolation ON tenants
     FOR ALL
     USING (id = app.current_tenant_id());

   -- Memberships table
   CREATE POLICY membership_isolation ON memberships
     FOR ALL
     USING (tenant_id = app.current_tenant_id());

   -- Permissions table
   CREATE POLICY permission_isolation ON permissions
     FOR ALL
     USING (tenant_id = app.current_tenant_id());

   -- Tenant roles table
   CREATE POLICY tenant_role_isolation ON tenant_roles
     FOR ALL
     USING (tenant_id = app.current_tenant_id());

   -- Role assignments table
   CREATE POLICY role_assignment_isolation ON role_assignments
     FOR ALL
     USING (tenant_id = app.current_tenant_id());

   -- Role permissions table
   CREATE POLICY role_permission_isolation ON role_permissions
     FOR ALL
     USING (tenant_id IN (
       SELECT id FROM tenant_roles WHERE tenant_id = app.current_tenant_id()
     ));
   ```

### Phase 3: Tenant Context Middleware

1. **Create PostgreSQL session variable setter**
   ```sql
   CREATE OR REPLACE FUNCTION app.set_tenant_context(tenant_id bigint)
   RETURNS void AS $$
     BEGIN
       PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
     END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **Update function to read session variable**
   ```sql
   CREATE OR REPLACE FUNCTION app.current_tenant_id()
   RETURNS bigint AS $$
     SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::bigint;
   $$ LANGUAGE sql STABLE;
   ```

3. **Implement middleware in TypeScript**
   ```typescript
   export async function setTenantContext(tenantId: string, db: DrizzleDB): Promise<void> {
     await db.execute(sql`SELECT app.set_tenant_context(${tenantId})`);
   }
   ```

### Phase 4: Update Repository Layer

1. **Add tenant context to all tenant-scoped queries**
   - Before each tenant query, call `setTenantContext`
   - Ensure tenant context is set within transaction

2. **Update UnitOfWork**
   ```typescript
   async execute<T>(work: (context: TransactionContext) => Promise<T>): Promise<T> {
     const context = this.getContext();
     context.activate();
     
     try {
       const result = await work(context);
       await context.commit();
       return result;
     } catch (error) {
       await context.rollback();
       throw error;
     } finally {
       context.deactivate();
     }
   }
   ```

### Phase 5: Testing

1. **Integration tests for RLS**
   - Test that users can only access their tenant data
   - Test that RLS blocks cross-tenant access
   - Test that admin users can bypass RLS (if needed)

2. **Performance testing**
   - Measure overhead of RLS policies
   - Optimize policies if needed

## Dependencies

- Drizzle Kit for migrations
- PostgreSQL 12+ (RLS support)
- Application-level tenant context propagation

## Estimated Effort

- Phase 1: 2 hours
- Phase 2: 1 hour
- Phase 3: 2 hours
- Phase 4: 3 hours
- Phase 5: 2 hours

**Total:** 10 hours

## Risks

1. **Performance impact** - RLS adds query overhead
2. **Migration complexity** - Existing data might need migration
3. **Application complexity** - Need to propagate tenant context everywhere
4. **Testing complexity** - Need comprehensive RLS testing

## Recommendations

1. **Start with new tables only** - Apply RLS to new tables first
2. **Gradual rollout** - Enable RLS in development first, then staging, then production
3. **Monitoring** - Add metrics for RLS policy hits and misses
4. **Fallback** - Keep application-level isolation as backup

## Status

**PENDING** - Requires migrations setup and careful database changes. Recommend implementing after other quick wins are complete.
