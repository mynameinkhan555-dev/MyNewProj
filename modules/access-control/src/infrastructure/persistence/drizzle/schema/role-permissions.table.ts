import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { tenantRoles } from './tenant-roles.table.js';
import { permissions } from './permissions.table.js';

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id').notNull().references(() => tenantRoles.id),
    permissionId: uuid('permission_id').notNull().references(() => permissions.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    roleIdIdx: index('role_permissions_role_id_idx').on(table.roleId),
    permissionIdIdx: index('role_permissions_permission_id_idx').on(table.permissionId),
    rolePermissionIdx: index('role_permissions_role_permission_idx').on(table.roleId, table.permissionId),
  }),
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
