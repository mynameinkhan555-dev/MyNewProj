import { pgTable, uuid, text, timestamp, unique, check, sql } from '@workspace/platform-database/drizzle-pg-core';
import { tenants } from '@workspace/tenant/infrastructure/persistence/drizzle/schema';

/**
 * tenant_roles table
 *
 * Domain: TenantRole aggregate
 * Lifecycle: ACTIVE → DELETED
 *
 * Constraints:
 * - PK: id (UUID)
 * - FK: tenant_id → tenants.id ON DELETE RESTRICT
 * - CHECK: status IN ('ACTIVE', 'DELETED')
 * - UNIQUE: (tenant_id, key)
 *
 * Note: tenant_id is immutable ownership boundary
 * Note: TenantRole should only reference TENANT-scoped permissions (enforced at application level)
 */
export const tenantRoles = pgTable('tenant_roles', {
  id: uuid('id').primaryKey().notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'restrict' }),
  key: text('key').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (table) => ({
  tenantKeyUnique: unique('uq_tenant_roles_tenant_key', table.tenantId, table.key),
  statusCheck: check('chk_tenant_roles_status', sql`${table.status} IN ('ACTIVE', 'DELETED')`),
}));

export type TenantRoleSelect = typeof tenantRoles.$inferSelect;
export type TenantRoleInsert = typeof tenantRoles.$inferInsert;
