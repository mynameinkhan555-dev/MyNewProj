import type { IUnitOfWork } from '@workspace/kernel';
import { TransactionContext } from './TransactionContext.js';
import {
  PersistenceError,
  UniqueConstraintViolation,
  ForeignKeyViolation,
  NotNullViolation,
  CheckConstraintViolation,
} from '../persistence/PersistenceError.js';

/**
 * Drizzle UnitOfWork Implementation (Infrastructure Layer)
 *
 * Implements IUnitOfWork port using Drizzle ORM transaction API.
 *
 * Transaction lifecycle:
 * - Context created before execute() (inactive state)
 * - BEGIN automatic on execute()
 * - Context activated with transaction
 * - COMMIT automatic on success (Drizzle handles this)
 * - ROLLBACK automatic on exception (Drizzle handles this)
 * - Context cleared in finally block
 *
 * Frozen architecture constraints:
 * - One UnitOfWork instance per use-case (NOT singleton)
 * - One execute() call per UnitOfWork instance (not reusable)
 * - Nested transactions NOT supported
 * - Transaction context is instance-scoped (prevents concurrency issues)
 * - Context has inactive/active/cleared states
 * - Repositories receive context via constructor (explicit binding)
 * - getContext() NOT exposed to Application (repositories receive context via constructor)
 * - DB client injected via constructor (schema composition in Composition Root)
 */
export class DrizzleUnitOfWork implements IUnitOfWork {
  private currentContext: TransactionContext | null = null;
  private executed: boolean = false;

  constructor(private readonly db: any) {}

  /**
   * Map PostgreSQL error to PersistenceError hierarchy.
   *
   * This is the canonical error mapping location for all repositories.
   * PostgreSQL error codes are mapped to typed errors.
   *
   * @param error - Error from Drizzle/PostgreSQL
   * @throws PersistenceError
   */
  private mapPersistenceError(error: any): never {
    // Only map PostgreSQL errors - preserve other errors as-is
    const code = error?.code || error?.cause?.code;

    // If this is not a PostgreSQL error code, re-throw as-is
    if (!code || typeof code !== 'string' || !code.match(/^23\d{3}$/)) {
      throw error;
    }

    const mappedError = (() => {
      switch (code) {
        case '23505': // unique_violation
          return new UniqueConstraintViolation(error?.constraint || error?.cause?.constraint);
        case '23503': // foreign_key_violation
          return new ForeignKeyViolation(error?.constraint || error?.cause?.constraint);
        case '23502': // not_null_violation
          return new NotNullViolation(error?.constraint || error?.cause?.constraint);
        case '23514': // check_violation
          return new CheckConstraintViolation(error?.constraint || error?.cause?.constraint);
        default:
          return new PersistenceError(
            error?.message || error?.cause?.message || 'A persistence error occurred.',
            'PERSISTENCE_ERROR',
            error?.constraint || error?.cause?.constraint
          );
      }
    })();

    throw mappedError;
  }

  /**
   * Get current transaction context.
   *
   * Called by composition root to bind repositories to the transaction.
   * This is an infrastructure concern - not exposed to Application layer.
   *
   * Context is created in inactive state. Repositories receive this
   * via constructor. Context is activated when transaction begins.
   *
   * @returns Transaction context (inactive until execute() is called)
   */
  getContext(): TransactionContext {
    if (this.currentContext === null) {
      this.currentContext = TransactionContext.create();
    }
    return this.currentContext;
  }

  /**
   * Execute work within a transaction.
   *
   * Automatically:
   * - BEGINs transaction before work
   * - Activates context with transaction
   * - COMMITs transaction on success (Drizzle handles this)
   * - ROLLBACKs transaction on exception (Drizzle handles this)
   * - Clears context in finally block
   *
   * Frozen invariant: One execute() call per UnitOfWork instance.
   * Throws if execute() is called more than once.
   *
   * @param work - Async function containing repository operations
   * @returns Result of work function
   * @throws Error if work function throws (transaction rolled back)
   * @throws Error if execute() is called more than once
   */
  async execute<T>(work: () => Promise<T>): Promise<T> {
    if (this.executed) {
      throw new Error(
        'UnitOfWork already executed. One UnitOfWork instance can only execute once. Create a new UnitOfWork instance for a new transaction.'
      );
    }

    if (this.currentContext === null) {
      this.currentContext = TransactionContext.create();
    }

    if (this.currentContext.isActive()) {
      throw new Error(
        'Nested transactions are not supported. A transaction is already active on this UnitOfWork instance.'
      );
    }

    this.executed = true;

    try {
      return await this.db.transaction(async (tx: any) => {
        // Activate context with transaction
        this.currentContext!.activate(tx);

        try {
          // Execute work
          const result = await work();

          // COMMIT automatic on success (Drizzle handles this)
          return result;
        } finally {
          // Clear transaction context after transaction completes
          this.currentContext!.clear();
        }
      });
    } catch (error: any) {
      // Map PostgreSQL error to PersistenceError hierarchy
      throw this.mapPersistenceError(error);
    }
    // ROLLBACK automatic on exception (Drizzle handles this)
  }
}
