import { TenantRoleId } from '../../../../src/domain/role/TenantRoleId.js';
import { PermissionId } from '../../../../src/domain/permission/PermissionId.js';
import type { RolePermissionSelect, RolePermissionInsert } from '../schema/role-permissions.table.js';

/**
 * Mapper between RolePermission domain model and persistence model
 */
export class RolePermissionMapper {
  static toDomain(row: RolePermissionSelect): { roleId: TenantRoleId; permissionId: PermissionId; createdAt: Date } {
    return {
      roleId: new TenantRoleId(row.roleId),
      permissionId: new PermissionId(row.permissionId),
      createdAt: row.createdAt,
    };
  }

  static toPersistence(roleId: TenantRoleId, permissionId: PermissionId, createdAt: Date): RolePermissionInsert {
    return {
      roleId: roleId.value,
      permissionId: permissionId.value,
      createdAt,
    };
  }
}
