/**
 * RoleStatus - lifecycle state for Role.
 *
 * ACTIVE → DELETED (terminal)
 *
 * No SUSPENDED state - temporary disabling can be handled
 * through RoleAssignment or application authorization policy.
 */
export enum RoleStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

// Alias for consistency with naming convention
export const TenantRoleStatus = RoleStatus;
