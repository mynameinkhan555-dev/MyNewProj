/**
 * Tenant lifecycle status.
 *
 * Lifecycle:
 * ACTIVE ↔ SUSPENDED
 *     ↓
 * DELETED (terminal)
 */
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}
