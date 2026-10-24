import { MembershipId } from '../MembershipId.js';
import { UserId } from '@workspace/identity';
import { TenantId } from '../TenantId.js';
import { Membership } from '../Membership.js';

/**
 * Membership Repository Port (Domain Layer)
 * 
 * Contract for Membership aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzleMembershipRepository).
 */
export interface IMembershipRepository {
  /**
   * Find membership by ID.
   * 
   * @param id - Membership ID
   * @returns Membership or null if not found
   */
  findById(id: MembershipId): Promise<Membership | null>;

  /**
   * Find all memberships for a user.
   * 
   * @param userId - User ID
   * @returns Array of Membership
   */
  findByUserId(userId: UserId): Promise<Membership[]>;

  /**
   * Find all memberships for a tenant.
   * 
   * @param tenantId - Tenant ID
   * @returns Array of Membership
   */
  findByTenantId(tenantId: TenantId): Promise<Membership[]>;

  /**
   * Find membership by user and tenant.
   *
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @returns Membership or null if not found
   */
  findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<Membership | null>;

  /**
   * Find memberships by user and tenant (plural).
   *
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @returns Array of Membership
   */
  findByUserIdAndTenantId(userId: UserId, tenantId: TenantId): Promise<Membership[]>;

  /**
   * Find active memberships for a user.
   * 
   * @param userId - User ID
   * @returns Array of active Membership
   */
  findActiveByUserId(userId: UserId): Promise<Membership[]>;

  /**
   * Find active memberships for a tenant.
   * 
   * @param tenantId - Tenant ID
   * @returns Array of active Membership
   */
  findActiveByTenantId(tenantId: TenantId): Promise<Membership[]>;

  /**
   * Insert new membership to persistence.
   * 
   * @param membership - Membership aggregate to insert
   * @throws PersistenceError on constraint violation (e.g., duplicate active membership)
   */
  insert(membership: Membership): Promise<void>;

  /**
   * Update existing membership in persistence.
   * 
   * @param membership - Membership aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(membership: Membership): Promise<void>;
}
