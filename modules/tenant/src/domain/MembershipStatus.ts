/**
 * Membership lifecycle status.
 *
 * Lifecycle:
 * ACTIVE ↔ SUSPENDED
 *     ↓
 * DELETED (terminal)
 *
 * DELETED means the User–Tenant relationship is terminated.
 * Does NOT mean User is deleted or Tenant is deleted.
 */
export enum MembershipStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}
