import { DomainError, Result, ok, err } from '@workspace/kernel';

/**
 * Permission key - canonical business identity for permissions.
 *
 * Format: resource.action (e.g., "member.read", "tenant.update")
 * - Immutable once created
 * - Canonical reference for authorization checks
 * - Used in cache, logs, audit, and seed data
 *
 * Examples:
 * - member.read
 * - member.create
 * - tenant.update
 * - role.assign
 * - billing.manage
 * - platform.audit
 * - platform.user.manage
 */
export class PermissionKey {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  /**
   * Create a PermissionKey from a string.
   *
   * Rules:
   * - At least two segments separated by "."
   * - Each segment must be non-empty
   * - No leading/trailing whitespace
   * - No consecutive dots
   *
   * @param value - Permission key string (e.g., "member.read")
   * @returns Result<PermissionKey, DomainError>
   */
  static create(value: string): Result<PermissionKey, DomainError> {
    if (!value || value.trim().length === 0) {
      return err(new DomainError('PERMISSION_KEY_REQUIRED', 'Permission key is required'));
    }

    const trimmed = value.trim();
    const segments = trimmed.split('.');

    // At least two segments required: resource.action
    if (segments.length < 2) {
      return err(
        new DomainError(
          'PERMISSION_KEY_INVALID_FORMAT',
          'Permission key must have at least two segments (resource.action)',
        ),
      );
    }

    // Each segment must be non-empty
    for (const segment of segments) {
      if (segment.length === 0) {
        return err(
          new DomainError(
            'PERMISSION_KEY_INVALID_SEGMENT',
            'Permission key segments cannot be empty',
          ),
        );
      }
    }

    return ok(new PermissionKey(trimmed));
  }

  /**
   * Reconstruct a PermissionKey from persisted state.
   * Assumes the value is already validated.
   *
   * @param value - Permission key string
   * @returns PermissionKey
   */
  static reconstruct(value: string): PermissionKey {
    return new PermissionKey(value);
  }

  /**
   * Get the resource part of the key (first segment).
   *
   * @example "member.read" → "member"
   */
  get resource(): string {
    return this._value.split('.')[0];
  }

  /**
   * Get the action part of the key (second segment).
   *
   * @example "member.read" → "read"
   */
  get action(): string {
    return this._value.split('.')[1];
  }

  equals(other: PermissionKey): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
