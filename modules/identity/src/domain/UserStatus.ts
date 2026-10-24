/**
 * User lifecycle status.
 * 
 * Lifecycle transitions:
 * - ACTIVE → SUSPENDED (suspend)
 * - SUSPENDED → ACTIVE (activate)
 * - ACTIVE → DELETED (delete)
 * - SUSPENDED → DELETED (delete)
 * - DELETED → (terminal state, no outgoing transitions)
 */
export enum UserStatus {
  /** User is active and can authenticate. */
  ACTIVE = 'ACTIVE',
  /** User is suspended and cannot authenticate. */
  SUSPENDED = 'SUSPENDED',
  /** User is deleted and cannot be recovered. */
  DELETED = 'DELETED',
}
