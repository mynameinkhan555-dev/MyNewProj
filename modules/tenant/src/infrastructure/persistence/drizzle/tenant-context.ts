import { sql } from 'drizzle-orm';
import type { DrizzleDB } from '@workspace/platform-database';

export async function setTenantContext(tenantId: string, db: DrizzleDB): Promise<void> {
  await db.execute(sql`SELECT app.set_tenant_context(${tenantId})`);
}

export async function clearTenantContext(db: DrizzleDB): Promise<void> {
  await db.execute(sql`SELECT set_config('app.current_tenant_id', '', false)`);
}
