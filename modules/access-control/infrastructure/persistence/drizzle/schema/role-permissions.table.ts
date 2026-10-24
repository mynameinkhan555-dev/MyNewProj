import { pgTable, uuid, timestamp } from '@workspace/platform-database/drizzle-pg-core';
import { tenantRoles } from './tenant-roles.table';
import { permissions } from './permissions.table';

/**
 * role_permissions table
 *
 * Domain: Relationship model (NOT an AggregateRoot)
 *
 * Constraints:
 * - PK: (role_id, permission_id) composite (added manually in migration)
 * - FK: role_id → tenant_roles.id ON DELETE RESTRICT
 * - FK: permission_id → permissions.id ON DELETE RESTRICT
 * - INDEX: role_id, permission_id (added manually in migration)
 *
 * Note: NO id, NO status, NO deleted_at, NO updated_at
 * Note: This is insert/delete relationship persistence, not soft-delete persistence
 * Note: created_at is immutable audit timestamp for security/history
 * Note: No cascade - Application orchestrates deletion
 *
 * Scope enforcement:
 * - Application layer should ensure TenantRole only references TENANT-scoped permissions
 * - This is NOT enforced at DB level due to composite PK and FK design complexity
 */
export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => tenantRoles.id, { onDelete: 'restrict' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
});

export type RolePermissionSelect = typeof rolePermissions.$inferSelect;
export type RolePermissionInsert = typeof rolePermissions.$inferInsert;
