/**
 * UnitOfWork Port (Application Layer)
 * 
 * Contract for transaction management.
 * Implemented by infrastructure layer (DrizzleUnitOfWork).
 * 
 * Responsibilities:
 * - BEGIN transaction (automatic on execute)
 * - COMMIT transaction (automatic on success)
 * - ROLLBACK transaction (automatic on exception)
 * - Provide transaction context to repositories (infrastructure concern)
 * 
 * Application does NOT know about:
 * - Drizzle transaction types
 * - BEGIN/COMMIT/ROLLBACK commands
 * - Transaction lifecycle details
 * - TransactionContext (infrastructure concern)
 * 
 * Frozen architecture constraints:
 * - One UnitOfWork instance per use-case (NOT singleton)
 * - Nested transactions NOT supported
 * - Repository cannot commit/rollback
 * - Transaction context is infrastructure concern
 * - Repositories receive context via constructor (explicit binding)
 */
export interface IUnitOfWork {
  /**
   * Execute work within a transaction.
   * 
   * Automatically:
   * - BEGINs transaction before work
   * - COMMITs transaction on success
   * - ROLLBACKs transaction on exception
   * 
   * @param work - Async function containing repository operations
   * @returns Result of work function
   * @throws Error if work function throws (transaction rolled back)
   */
  execute<T>(work: () => Promise<T>): Promise<T>;
}
