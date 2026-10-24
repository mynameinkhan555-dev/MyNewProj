import type { RolePermission } from '@workspace/access-control/domain/role-permission/index.js';
import type { NewRolePermission } from '../schema/role-permissions.table.js';
import { TenantRoleId } from '@workspace/access-control/domain/role/TenantRoleId.js';
import { PermissionId } from '@workspace/access-control/domain/permission/PermissionId.js';

export function rolePermissionToDb(rolePermission: RolePermission): NewRolePermission {
  return {
    roleId: rolePermission.roleId.value,
    permissionId: rolePermission.permissionId.value,
    createdAt: rolePermission.createdAt,
  };
}

export function dbToRolePermission(row: {
  roleId: string;
  permissionId: string;
  createdAt: Date;
}): RolePermission {
  return {
    roleId: new TenantRoleId(row.roleId),
    permissionId: new PermissionId(row.permissionId),
    createdAt: row.createdAt,
  };
}
