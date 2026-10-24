/**
 * Permission scope distinguishes between platform-level and tenant-level permissions.
 *
 * TENANT: Tenant-specific permissions (e.g., member.read, tenant.update)
 * PLATFORM: Platform-wide permissions (e.g., platform.audit, platform.user.manage)
 */
export enum PermissionScope {
  TENANT = 'TENANT',
  PLATFORM = 'PLATFORM',
}
