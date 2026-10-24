import { pgTable, uuid, text, timestamp } from '@workspace/platform-database/drizzle-pg-core';

/**
 * tenants table
 *
 * Domain: Tenant aggregate
 * Lifecycle: ACTIVE → SUSPENDED → DELETED
 *
 * Constraints:
 * - PK: id (UUID)
 * - CHECK: status IN ('ACTIVE', 'SUSPENDED', 'DELETED')
 *
 * Note: Tenant is a root aggregate, not owned by User
 * Membership table connects User ↔ Tenant
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().notNull(),
  name: text('name').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export type TenantSelect = typeof tenants.$inferSelect;
export type TenantInsert = typeof tenants.$inferInsert;
