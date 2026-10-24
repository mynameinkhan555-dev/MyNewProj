import { eq } from 'drizzle-orm';
import { users } from '../schema/users.table';
import type { UserSelect, UserInsert } from '../schema/users.table';
import { UserMapper } from '../mappers/user.mapper';
import type { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import type { User } from '../../../../domain/User';
import type { UserId } from '../../../../domain/UserId';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { UserNotFoundError } from '@workspace/platform-database/persistence';

/**
 * Drizzle User Repository Implementation (Infrastructure Layer)
 *
 * Implements IUserRepository port using Drizzle ORM.
 *
 * Transaction binding:
 * - Receives TransactionContext via constructor
 * - All operations use context.getTransaction()
 * - TransactionContext throws if inactive (enforces transaction boundary)
 *
 * Error handling:
 * - PostgreSQL constraint violations are mapped by DrizzleUnitOfWork
 * - UPDATE 0 rows → UserNotFoundError
 *
 * Frozen architecture constraints:
 * - findById() returns ALL statuses (ACTIVE, SUSPENDED, DELETED)
 * - insert() throws on constraint violation
 * - update() throws UserNotFoundError if 0 rows affected
 * - Repository does NOT create its own transaction
 * - Repository does NOT commit/rollback
 * - Repository does NOT validate business rules
 */
export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly context: TransactionContext) {}

  /**
   * Find user by ID.
   *
   * Returns User if found (any status: ACTIVE, SUSPENDED, DELETED).
   * Returns null if not found.
   *
   * @param id - User ID
   * @returns User or null if not found
   */
  async findById(id: UserId): Promise<User | null> {
    const db = this.context.getTransaction();

    const rows = await db.select().from(users).where(eq(users.id, id.value)).limit(1);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0] as UserSelect;
    return UserMapper.toDomain(row);
  }

  /**
   * Insert new user to persistence.
   *
   * @param user - User aggregate to insert
   * @throws Error on database failures (mapped by UnitOfWork at transaction boundary)
   */
  async insert(user: User): Promise<void> {
    const db = this.context.getTransaction();
    const row = UserMapper.toPersistence(user);

    await db.insert(users).values(row);
  }

  /**
   * Update existing user in persistence.
   *
   * @param user - User aggregate to update
   * @throws UserNotFoundError if user not found (0 rows affected)
   * @throws Error on database failures (mapped by UnitOfWork at transaction boundary)
   */
  async update(user: User): Promise<void> {
    const db = this.context.getTransaction();
    const row = UserMapper.toPersistence(user);

    const result = await db.update(users).set(row).where(eq(users.id, user.id.value)).returning();

    if (result.length === 0) {
      throw new UserNotFoundError(user.id.value);
    }
  }
}
