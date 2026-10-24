import { DomainError, Result, ok, err } from '@workspace/kernel';

/**
 * RoleKey - canonical business identity for Role.
 *
 * Examples: admin, member, manager, billing-admin
 *
 * RoleKey is immutable and used for:
 * - authorization lookup
 * - cache keys
 * - audit logs
 * - API references
 * - seed data
 *
 * Validation rules:
 * - Not empty
 * - No leading/trailing whitespace
 * - Valid characters: a-z, 0-9, hyphen, underscore
 * - Min length: 2, Max length: 100
 *
 * Note: Exact naming convention (prefix, style) is application policy.
 * Domain only enforces basic validity.
 */
export class RoleKey {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Create a RoleKey with validation.
   */
  static create(input: string): Result<RoleKey, DomainError> {
    if (!input || typeof input !== 'string') {
      return err(new DomainError('ROLE_KEY_EMPTY', 'Role key cannot be empty'));
    }

    const trimmed = input.trim();

    if (trimmed.length === 0) {
      return err(new DomainError('ROLE_KEY_EMPTY', 'Role key cannot be empty'));
    }

    if (trimmed.length < 2) {
      return err(new DomainError('ROLE_KEY_TOO_SHORT', 'Role key must be at least 2 characters'));
    }

    if (trimmed.length > 100) {
      return err(new DomainError('ROLE_KEY_TOO_LONG', 'Role key must be at most 100 characters'));
    }

    // Valid characters: a-z, 0-9, hyphen, underscore
    const validPattern = /^[a-z0-9_-]+$/;
    if (!validPattern.test(trimmed)) {
      return err(
        new DomainError(
          'ROLE_KEY_INVALID',
          'Role key can only contain lowercase letters, numbers, hyphens, and underscores',
        ),
      );
    }

    return ok(new RoleKey(trimmed));
  }

  /**
   * Reconstruct a RoleKey from persisted state (bypass validation).
   */
  static reconstruct(value: string): RoleKey {
    return new RoleKey(value);
  }

  /**
   * Check equality.
   */
  equals(other: RoleKey): boolean {
    return this.value === other.value;
  }

  /**
   * String representation.
   */
  toString(): string {
    return this.value;
  }
}
