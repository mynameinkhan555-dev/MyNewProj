/**
 * RolePermission Security Events (Application/Outbox Level)
 *
 * These are NOT TenantRole domain events. They are security/integration events
 * emitted by Application Use Cases (GrantPermissionToRoleUseCase, RevokePermissionFromRoleUseCase).
 *
 * Purpose:
 * - Security audit trail
 * - Authorization cache invalidation
 * - Integration notifications
 * - Compliance logging
 *
 * These events are NOT used for domain state reconstruction.
 * Domain state is reconstructed from:
 * - TenantRole (domain events)
 * - Permission (domain events)
 * - RolePermission (persistence relationship)
 */

/**
 * Emitted when a permission is granted to a role.
 *
 * Security significance: This represents a change in authorization capabilities.
 * May trigger:
 * - Cache invalidation for users with this role
 * - Audit logging
 * - Security monitoring
 * - Integration notifications
 */
export interface RolePermissionGrantedEvent {
  eventId: string;
  eventName: 'rolePermission.RolePermissionGranted';
  occurredAt: Date;

  // Actor information (who performed the action)
  actorUserId: string;
  actorMembershipId: string;

  // Target information
  roleId: string;
  roleKey: string;
  tenantId: string;

  permissionId: string;
  permissionKey: string;
  permissionScope: string;

  // Audit metadata
  grantTimestamp: Date;
}

/**
 * Emitted when a permission is revoked from a role.
 *
 * Security significance: This represents a removal of authorization capabilities.
 * May trigger:
 * - Cache invalidation for users with this role
 * - Audit logging
 * - Security monitoring
 * - Integration notifications
 */
export interface RolePermissionRevokedEvent {
  eventId: string;
  eventName: 'rolePermission.RolePermissionRevoked';
  occurredAt: Date;

  // Actor information (who performed the action)
  actorUserId: string;
  actorMembershipId: string;

  // Target information
  roleId: string;
  roleKey: string;
  tenantId: string;

  permissionId: string;
  permissionKey: string;
  permissionScope: string;

  // Audit metadata
  revokeTimestamp: Date;
}
