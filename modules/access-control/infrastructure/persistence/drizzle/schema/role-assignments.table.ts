import { pgTable, uuid, text, timestamp, check, sql } from '@workspace/platform-database/drizzle-pg-core';
import { memberships } from '@workspace/tenant/infrastructure/persistence/drizzle/schema';
import { tenantRoles } from './tenant-roles.table';

/**
 * role_assignments table
 *
 * Domain: RoleAssignment aggregate
 * Lifecycle: ACTIVE → DELETED
 *
 * Constraints:
 * - PK: id (UUID)
 * - FK: membership_id → memberships.id ON DELETE RESTRICT
 * - FK: role_id → tenant_roles.id ON DELETE RESTRICT
 * - CHECK: status IN ('ACTIVE', 'DELETED')
 * - PARTIAL UNIQUE: (membership_id, role_id) WHERE status = 'ACTIVE' (added manually in migration)
 * - INDEX: membership_id, role_id (added manually in migration)
 *
 * Note: Links Membership to TenantRole for authorization
 * Note: No cascade - Application orchestrates deletion
 */
export const roleAssignments = pgTable('role_assignments', {
  id: uuid('id').primaryKey().notNull(),
  membershipId: uuid('membership_id').notNull().references(() => memberships.id, { onDelete: 'restrict' }),
  roleId: uuid('role_id').notNull().references(() => tenantRoles.id, { onDelete: 'restrict' }),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (table) => ({
  statusCheck: check('chk_role_assignments_status', sql`${table.status} IN ('ACTIVE', 'DELETED')`),
}));

export type RoleAssignmentSelect = typeof roleAssignments.$inferSelect;
export type RoleAssignmentInsert = typeof roleAssignments.$inferInsert;
