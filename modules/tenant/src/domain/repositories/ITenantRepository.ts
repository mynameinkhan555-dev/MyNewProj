import { TenantId } from '../TenantId.js';
import { Tenant } from '../Tenant.js';

/**
 * Tenant Repository Port (Domain Layer)
 * 
 * Contract for Tenant aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzleTenantRepository).
 */
export interface ITenantRepository {
  /**
   * Find tenant by ID.
   * 
   * @param id - Tenant ID
   * @returns Tenant or null if not found
   */
  findById(id: TenantId): Promise<Tenant | null>;

  /**
   * Find tenant by name.
   * 
   * @param name - Tenant name
   * @returns Tenant or null if not found
   */
  findByName(name: string): Promise<Tenant | null>;

  /**
   * Insert new tenant to persistence.
   * 
   * @param tenant - Tenant aggregate to insert
   * @throws PersistenceError on constraint violation
   */
  insert(tenant: Tenant): Promise<void>;

  /**
   * Update existing tenant in persistence.
   * 
   * @param tenant - Tenant aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(tenant: Tenant): Promise<void>;
}
