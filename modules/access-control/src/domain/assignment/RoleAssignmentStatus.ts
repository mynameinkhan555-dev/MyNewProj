/**
 * RoleAssignmentStatus - lifecycle state for RoleAssignment.
 *
 * ACTIVE → DELETED (terminal)
 *
 * No SUSPENDED state - temporary disabling can be handled
 * through Membership lifecycle or Role lifecycle.
 */
export enum RoleAssignmentStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}
