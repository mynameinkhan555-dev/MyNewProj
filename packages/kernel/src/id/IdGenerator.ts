/**
 * ID generation abstraction.
 *
 * Why this matters:
 * - Domain logic should not depend on specific ID generation mechanisms
 * - Enables deterministic testing for ID-dependent logic
 * - Allows switching ID strategies without changing domain code
 */
export interface IdGenerator {
  /**
   * Generate a new unique identifier.
   * Returns a string representation of the ID.
   */
  generate(): string;
}
