/**
 * Clock abstraction for time-dependent domain logic.
 *
 * Why this matters:
 * - Domain logic must not depend directly on `new Date()` everywhere
 * - Enables deterministic tests for session expiry, token expiry, membership expiration, timestamps
 * - Allows time injection for testing scenarios
 */
export interface Clock {
  /**
   * Get the current time.
   * Returns a Date object representing the current moment.
   */
  now(): Date;
}
