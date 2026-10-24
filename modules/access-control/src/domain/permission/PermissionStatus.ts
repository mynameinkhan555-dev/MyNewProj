/**
 * Permission lifecycle status.
 *
 * Permissions are capability definitions.
 * ACTIVE: Permission is available for assignment to roles
 * DELETED: Permission is removed from use (terminal state)
 *
 * Note: No SUSPENDED state. Temporary disabling is handled via
 * RolePermission relationships or application authorization policy.
 */
export enum PermissionStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}
