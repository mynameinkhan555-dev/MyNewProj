import { TenantRoleId } from '../role/TenantRoleId.js';
import { PermissionId } from '../permission/PermissionId.js';

/**
 * RolePermission Repository Port (Domain Layer)
 *
 * Contract for RolePermission relationship persistence operations.
 * RolePermission is a relationship model, not an aggregate.
 *
 * Implemented by infrastructure layer (DrizzleRolePermissionRepository).
 */
export interface IRolePermissionRepository {
  /**
   * Find all permissions for a role.
   *
   * @param roleId - TenantRole ID
   * @returns Array of Permission IDs
   */
  findByRoleId(roleId: TenantRoleId): Promise<PermissionId[]>;

  /**
   * Find all permissions for multiple roles.
   *
   * @param roleIds - Array of TenantRole IDs
   * @returns Array of Permission IDs
   */
  findByRoleIds(roleIds: TenantRoleId[]): Promise<PermissionId[]>;

  /**
   * Find a specific role-permission association.
   *
   * @param roleId - TenantRole ID
   * @param permissionId - Permission ID
   * @returns RolePermission object or null
   */
  findByRoleAndPermission(roleId: TenantRoleId, permissionId: PermissionId): Promise<{ id: string; tenantRoleId: string; permissionId: string; } | null>;

  /**
   * Find all roles that have a permission.
   *
   * @param permissionId - Permission ID
   * @returns Array of TenantRole IDs
   */
  findByPermissionId(permissionId: PermissionId): Promise<TenantRoleId[]>;

  /**
   * Check if a role has a specific permission.
   *
   * @param roleId - TenantRole ID
   * @param permissionId - Permission ID
   * @returns true if relationship exists
   */
  exists(roleId: TenantRoleId, permissionId: PermissionId): Promise<boolean>;

  /**
   * Grant a permission to a role (INSERT).
   *
   * @param roleId - TenantRole ID
   * @param permissionId - Permission ID
   * @throws PersistenceError on constraint violation
   */
  grant(roleId: TenantRoleId, permissionId: PermissionId): Promise<void>;

  /**
   * Revoke a permission from a role (DELETE).
   *
   * @param roleId - TenantRole ID
   * @param permissionId - Permission ID
   */
  revoke(roleId: TenantRoleId, permissionId: PermissionId): Promise<void>;
}
