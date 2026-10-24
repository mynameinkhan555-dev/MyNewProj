/**
 * Transaction Context (Infrastructure Layer)
 * 
 * UnitOfWork-scoped transaction context for repositories.
 * 
 * This is an infrastructure concern - repositories use this to access
 * the current transaction, but Application layer does not know about it.
 * 
 * Lifecycle:
 * 1. Created by composition root (inactive state)
 * 2. Passed to repositories via constructor
 * 3. Activated by UnitOfWork when transaction begins
 * 4. Cleared by UnitOfWork in finally block
 * 
 * State machine:
 * - INACTIVE: Created, not yet activated
 * - ACTIVE: Activated with transaction
 * - CLEARED: Transaction completed, context cleared
 * 
 * Frozen architecture constraints:
 * - One TransactionContext per UnitOfWork instance (NOT static singleton)
 * - Each UnitOfWork instance holds its own context
 * - Repositories access this via constructor (explicit binding)
 * - Context has inactive/active/cleared states
 * - activate() only allowed on inactive context
 * - getTransaction() only allowed on active context
 * - clear() is idempotent (safe to call multiple times)
 * - Repository operations fail if context is not active
 * - Prevents concurrency issues in parallel requests
 */
export class TransactionContext {
  private tx: any | null = null;
  private active: boolean = false;
  private cleared: boolean = false;

  private constructor() {}

  /**
   * Create inactive transaction context.
   * 
   * Called by composition root before transaction begins.
   * Repositories receive this inactive context via constructor.
   * 
   * @returns Inactive transaction context
   */
  static create(): TransactionContext {
    return new TransactionContext();
  }

  /**
   * Activate context with transaction.
   * 
   * Called by UnitOfWork when transaction begins.
   * This is infrastructure-only - Application layer does not call this.
   * 
   * State machine: Only allowed on inactive context.
   * Throws if context is already active or cleared.
   * 
   * @param tx - Drizzle transaction client
   * @throws Error if context is already active or cleared
   */
  activate(tx: any): void {
    if (this.cleared) {
      throw new Error('Cannot activate cleared transaction context. Create a new UnitOfWork instance.');
    }
    if (this.active) {
      throw new Error('Transaction context is already active. Cannot activate twice.');
    }
    this.tx = tx;
    this.active = true;
  }

  /**
   * Clear context.
   * 
   * Called by UnitOfWork in finally block.
   * This is infrastructure-only - Application layer does not call this.
   * 
   * State machine: Idempotent - safe to call multiple times.
   * 
   * @throws Error if context is inactive (never activated)
   */
  clear(): void {
    if (!this.active && !this.cleared) {
      // Context was never activated - this is likely a bug
      throw new Error('Cannot clear inactive transaction context that was never activated.');
    }
    this.tx = null;
    this.active = false;
    this.cleared = true;
  }

  /**
   * Get transaction client.
   * 
   * Called by repositories to execute queries.
   * Throws if context is not active.
   * 
   * @returns Drizzle transaction client
   * @throws Error if context is not active
   */
  getTransaction(): any {
    if (!this.active || this.tx === null) {
      throw new Error('Transaction context is not active. Repository operations must execute within an active UnitOfWork transaction.');
    }
    return this.tx;
  }

  /**
   * Check if context is active.
   * 
   * @returns true if transaction is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Check if context is cleared.
   * 
   * @returns true if context has been cleared
   */
  isCleared(): boolean {
    return this.cleared;
  }
}
