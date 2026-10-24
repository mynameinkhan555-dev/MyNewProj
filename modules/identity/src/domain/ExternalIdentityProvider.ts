import { ValueObject, DomainError, Result, ok, err } from '@workspace/kernel';

interface ProviderProps {
  value: string;
}

export class ExternalIdentityProvider extends ValueObject<ProviderProps> {
  private readonly _value: string;

  private constructor(value: string) {
    super({ value });
    this._value = value;
  }

  /**
   * Factory for reconstruction (bypasses validation).
   * For use only by reconstruct methods that have already validated data.
   *
   * @param value - Pre-validated canonical provider value
   * @returns ExternalIdentityProvider value object
   */
  static fromCanonical(value: string): ExternalIdentityProvider {
    return new ExternalIdentityProvider(value);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Create an ExternalIdentityProvider value object from a raw string.
   *
   * Process:
   * 1. Trim whitespace
   * 2. Normalize to uppercase
   * 3. Validate minimal structure
   *
   * Note: This does NOT enforce a strict whitelist of known providers.
   * New providers (DISCORD, LINKEDIN, CUSTOM_OIDC, etc.) can be added
   * without modifying the domain model.
   *
   * @param raw - Raw provider string
   * @returns Result<ExternalIdentityProvider, DomainError>
   */
  static create(raw: string): Result<ExternalIdentityProvider, DomainError> {
    // 1. Trim
    const trimmed = raw.trim();

    // 2. Normalize to uppercase
    const canonical = trimmed.toUpperCase();

    // 3. Validate minimal structure
    if (!ExternalIdentityProvider.isValid(canonical)) {
      return err(new DomainError('INVALID_PROVIDER', 'Invalid provider format'));
    }

    return ok(new ExternalIdentityProvider(canonical));
  }

  /**
   * Validate provider format (minimal structural validation).
   *
   * Requirements:
   * - Non-empty
   * - Reasonable length
   * - Alphanumeric and underscores only (common provider naming convention)
   *
   * This is NOT a strict whitelist enforcement.
   * New providers can be added without domain model changes.
   *
   * @param provider - Provider string to validate
   * @returns true if valid, false otherwise
   */
  private static isValid(provider: string): boolean {
    // Minimal validation: non-empty, reasonable length, alphanumeric + underscores
    const providerRegex = /^[A-Z0-9_]+$/;
    return provider.length > 0 && provider.length <= 50 && providerRegex.test(provider);
  }

  /**
   * Check equality based on canonical value.
   *
   * @param other - Another ExternalIdentityProvider value object
   * @returns true if canonical values are equal
   */
  equals(other: ExternalIdentityProvider): boolean {
    return this._value === other._value;
  }
}
