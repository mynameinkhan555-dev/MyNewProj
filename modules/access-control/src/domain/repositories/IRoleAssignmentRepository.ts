import { RoleAssignmentId } from '../assignment/RoleAssignmentId.js';
import { MembershipId } from '@workspace/tenant';
import { TenantRoleId } from '../role/TenantRoleId.js';
import { RoleAssignment } from '../assignment/RoleAssignment.js';

/**
 * RoleAssignment Repository Port (Domain Layer)
 * 
 * Contract for RoleAssignment aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzleRoleAssignmentRepository).
 */
export interface IRoleAssignmentRepository {
  /**
   * Find role assignment by ID.
   * 
   * @param id - RoleAssignment ID
   * @returns RoleAssignment or null if not found
   */
  findById(id: RoleAssignmentId): Promise<RoleAssignment | null>;

  /**
   * Find all role assignments for a membership.
   *
   * @param membershipId - Membership ID
   * @returns Array of RoleAssignment
   */
  findByMembershipId(membershipId: MembershipId): Promise<RoleAssignment[]>;

  /**
   * Find all role assignments for multiple memberships.
   *
   * @param membershipIds - Array of Membership IDs
   * @returns Array of RoleAssignment
   */
  findByMembershipIds(membershipIds: MembershipId[]): Promise<RoleAssignment[]>;

  /**
   * Find role assignment by membership and role.
   * 
   * @param membershipId - Membership ID
   * @param roleId - TenantRole ID
   * @returns RoleAssignment or null if not found
   */
  findByMembershipAndRole(
    membershipId: MembershipId,
    roleId: TenantRoleId,
  ): Promise<RoleAssignment | null>;

  /**
   * Find active role assignments for a membership.
   * 
   * @param membershipId - Membership ID
   * @returns Array of active RoleAssignment
   */
  findActiveByMembershipId(membershipId: MembershipId): Promise<RoleAssignment[]>;

  /**
   * Insert new role assignment to persistence.
   * 
   * @param roleAssignment - RoleAssignment aggregate to insert
   * @throws PersistenceError on constraint violation (e.g., duplicate active assignment)
   */
  insert(roleAssignment: RoleAssignment): Promise<void>;

  /**
   * Update existing role assignment in persistence.
   * 
   * @param roleAssignment - RoleAssignment aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(roleAssignment: RoleAssignment): Promise<void>;
}
