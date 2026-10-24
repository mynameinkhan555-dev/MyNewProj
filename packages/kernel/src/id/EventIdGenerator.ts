/**
 * Event ID generation abstraction.
 *
 * Why this matters:
 * - Domain logic should not depend on specific event ID generation mechanisms
 * - Enables deterministic testing for event-dependent logic
 * - Allows switching event ID strategies without changing domain code
 */
export interface EventIdGenerator {
  /**
   * Generate a new unique event identifier.
   * Returns a string representation of the event ID.
   */
  generate(): string;
}
