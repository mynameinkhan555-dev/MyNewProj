import { pgTable, uuid, text, timestamp, unique, check, sql, jsonb } from '@workspace/platform-database/drizzle-pg-core';

/**
 * permissions table
 * 
 * Domain: Permission aggregate
 * Lifecycle: ACTIVE → DELETED
 * 
 * Constraints:
 * - PK: id (UUID)
 * - CHECK: scope IN ('TENANT', 'PLATFORM')
 * - CHECK: status IN ('ACTIVE', 'DELETED')
 * - UNIQUE: key
 * 
 * Note: NO tenant_id - Permission is global regardless of scope
 * Note: scope indicates whether permission applies to TENANT context or PLATFORM context
 * 
 * Scope:
 * - TENANT: Permission applicable to tenant-level operations
 * - PLATFORM: Permission applicable to platform-level operations
 * 
 * Note: Relationship between TenantRole and Permission scope is APPLICATION-level enforcement
 * - TenantRole should only reference TENANT-scoped permissions
 * - This constraint is NOT enforced at DB level due to FK design complexity
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().notNull(),
  key: text('key').notNull(),
  scope: text('scope').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (table) => ({
  keyUnique: unique('uq_permissions_key', table.key),
  scopeCheck: check('chk_permissions_scope', sql`${table.scope} IN ('TENANT', 'PLATFORM')`),
  statusCheck: check('chk_permissions_status', sql`${table.status} IN ('ACTIVE', 'DELETED')`),
}));

export type PermissionSelect = typeof permissions.$inferSelect;
export type PermissionInsert = typeof permissions.$inferInsert;
