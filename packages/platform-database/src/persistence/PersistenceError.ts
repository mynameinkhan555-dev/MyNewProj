/**
 * Persistence Error Hierarchy (Infrastructure Layer)
 *
 * Infrastructure-level errors for database operations.
 * These are NOT DomainError - they represent persistence-layer failures.
 *
 * PostgreSQL error codes are mapped to typed errors at the UnitOfWork
 * transaction boundary.
 * Application layer interprets the meaning, not the raw PostgreSQL code.
 *
 * Frozen architecture constraints:
 * - UnitOfWork translates PostgreSQL errors to PersistenceError
 * - Repositories may throw persistence-specific errors such as not-found errors
 * - PostgreSQL codes are not exposed to Application
 * - Application interprets error meaning based on error type
 * - Constraint name may be included for debugging
 *
 * Hierarchy:
 * - PersistenceError (base)
 *   - PersistenceNotFoundError (not found in persistence)
 *     - UserNotFoundError, TenantNotFoundError, etc.
 *   - UniqueConstraintViolation (23505)
 *   - ForeignKeyViolation (23503)
 *   - NotNullViolation (23502)
 *   - CheckConstraintViolation (23514)
 */

/**
 * Base persistence error.
 *
 * All persistence-related errors extend this class.
 */
export class PersistenceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly constraint?: string
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/**
 * Record not found in persistence.
 *
 * This is not a PostgreSQL error code.
 * Thrown when UPDATE/DELETE affects 0 rows when at least 1 was expected.
 *
 * Subclass pattern:
 * - UserNotFoundError extends PersistenceNotFoundError
 * - TenantNotFoundError extends PersistenceNotFoundError
 * - etc.
 */
export class PersistenceNotFoundError extends PersistenceError {
  constructor(message: string) {
    super(message, 'PERSISTENCE_NOT_FOUND');
    this.name = 'PersistenceNotFoundError';
  }
}

/**
 * User-specific not found error.
 *
 * Thrown when User aggregate is not found during update.
 */
export class UserNotFoundError extends PersistenceNotFoundError {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Unique constraint violation.
 *
 * PostgreSQL code: 23505
 *
 * Thrown when a unique constraint is violated (duplicate key).
 */
export class UniqueConstraintViolation extends PersistenceError {
  constructor(constraint?: string) {
    super('A unique constraint was violated.', 'PERSISTENCE_UNIQUE_VIOLATION', constraint);
    this.name = 'UniqueConstraintViolation';
  }
}

/**
 * Foreign key constraint violation.
 *
 * PostgreSQL code: 23503
 *
 * Thrown when a foreign key constraint is violated.
 */
export class ForeignKeyViolation extends PersistenceError {
  constructor(constraint?: string) {
    super(
      'A foreign key constraint was violated.',
      'PERSISTENCE_FOREIGN_KEY_VIOLATION',
      constraint
    );
    this.name = 'ForeignKeyViolation';
  }
}

/**
 * Not null constraint violation.
 *
 * PostgreSQL code: 23502
 *
 * Thrown when a not null constraint is violated.
 */
export class NotNullViolation extends PersistenceError {
  constructor(constraint?: string) {
    super('A not null constraint was violated.', 'PERSISTENCE_NOT_NULL_VIOLATION', constraint);
    this.name = 'NotNullViolation';
  }
}

/**
 * Check constraint violation.
 *
 * PostgreSQL code: 23514
 *
 * Thrown when a check constraint is violated.
 */
export class CheckConstraintViolation extends PersistenceError {
  constructor(constraint?: string) {
    super('A check constraint was violated.', 'PERSISTENCE_CHECK_CONSTRAINT_VIOLATION', constraint);
    this.name = 'CheckConstraintViolation';
  }
}
