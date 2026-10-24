import { TenantRoleId } from '../role/TenantRoleId.js';
import { TenantId } from '@workspace/tenant';
import { TenantRole } from '../role/TenantRole.js';

/**
 * TenantRole Repository Port (Domain Layer)
 * 
 * Contract for TenantRole aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzleTenantRoleRepository).
 */
export interface ITenantRoleRepository {
  /**
   * Find tenant role by ID.
   * 
   * @param id - TenantRole ID
   * @returns TenantRole or null if not found
   */
  findById(id: TenantRoleId): Promise<TenantRole | null>;

  /**
   * Find tenant role by tenant and key.
   * 
   * @param tenantId - Tenant ID
   * @param key - Role key (e.g., 'admin', 'member')
   * @returns TenantRole or null if not found
   */
  findByTenantAndKey(tenantId: TenantId, key: string): Promise<TenantRole | null>;

  /**
   * Find all roles for a tenant.
   * 
   * @param tenantId - Tenant ID
   * @returns Array of TenantRole
   */
  findByTenantId(tenantId: TenantId): Promise<TenantRole[]>;

  /**
   * Insert new tenant role to persistence.
   * 
   * @param tenantRole - TenantRole aggregate to insert
   * @throws PersistenceError on constraint violation (e.g., duplicate key for tenant)
   */
  insert(tenantRole: TenantRole): Promise<void>;

  /**
   * Update existing tenant role in persistence.
   * 
   * @param tenantRole - TenantRole aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(tenantRole: TenantRole): Promise<void>;
}
