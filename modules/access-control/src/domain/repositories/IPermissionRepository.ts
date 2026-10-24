import { PermissionId } from '../permission/PermissionId.js';
import { PermissionScope } from '../permission/PermissionScope.js';
import { Permission } from '../permission/Permission.js';

/**
 * Permission Repository Port (Domain Layer)
 * 
 * Contract for Permission aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzlePermissionRepository).
 */
export interface IPermissionRepository {
  /**
   * Find permission by ID.
   *
   * @param id - Permission ID
   * @returns Permission or null if not found
   */
  findById(id: PermissionId): Promise<Permission | null>;

  /**
   * Find permissions by multiple IDs.
   *
   * @param ids - Array of Permission IDs
   * @returns Array of Permission
   */
  findByIds(ids: PermissionId[]): Promise<Permission[]>;

  /**
   * Find permission by key.
   * 
   * @param key - Permission key (e.g., 'user.read', 'tenant.admin')
   * @returns Permission or null if not found
   */
  findByKey(key: string): Promise<Permission | null>;

  /**
   * Find all permissions.
   * 
   * @returns Array of all Permission
   */
  findAll(): Promise<Permission[]>;

  /**
   * Find permissions by scope.
   * 
   * @param scope - Permission scope (TENANT or PLATFORM)
   * @returns Array of Permission with given scope
   */
  findByScope(scope: PermissionScope): Promise<Permission[]>;

  /**
   * Insert new permission to persistence.
   * 
   * @param permission - Permission aggregate to insert
   * @throws PersistenceError on constraint violation (e.g., duplicate key)
   */
  insert(permission: Permission): Promise<void>;

  /**
   * Update existing permission in persistence.
   * 
   * @param permission - Permission aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(permission: Permission): Promise<void>;
}
