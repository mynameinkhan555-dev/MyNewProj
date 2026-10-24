import { ValueObject, DomainError, Result, ok, err } from '@workspace/kernel';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private readonly _value: string;

  private constructor(value: string) {
    super({ value });
    this._value = value;
  }

  /**
   * Factory for reconstruction (bypasses validation).
   * For use only by reconstruct methods that have already validated data.
   *
   * @param value - Pre-validated canonical email value
   * @returns Email value object
   */
  static fromCanonical(value: string): Email {
    return new Email(value);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Create an Email value object from a raw string.
   * 
   * Process:
   * 1. Trim whitespace
   * 2. Validate format (moderate/practical)
   * 3. Normalize to lowercase canonical representation
   * 
   * @param raw - Raw email string
   * @returns Result<Email, DomainError>
   */
  static create(raw: string): Result<Email, DomainError> {
    // 1. Trim
    const trimmed = raw.trim();

    // 2. Validate (moderate/practical)
    if (!Email.isValid(trimmed)) {
      return err(new DomainError('INVALID_EMAIL', 'Invalid email format'));
    }

    // 3. Normalize to lowercase canonical representation
    const canonical = trimmed.toLowerCase();

    return ok(new Email(canonical));
  }

  /**
   * Validate email format (moderate/practical).
   * 
   * Requirements:
   * - Contains @
   * - Has local part and domain part
   - No whitespace
   * - Domain has at least one dot
   * 
   * This is NOT full RFC 5322 compliance.
   * It's practical validation for application use.
   * Email existence is verified separately in verification flow.
   * 
   * @param email - Email string to validate
   * @returns true if valid, false otherwise
   */
  private static isValid(email: string): boolean {
    // Moderate validation: has @, local part, domain with at least one dot, no whitespace
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check equality based on canonical value.
   * 
   * @param other - Another Email value object
   * @returns true if canonical values are equal
   */
  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
