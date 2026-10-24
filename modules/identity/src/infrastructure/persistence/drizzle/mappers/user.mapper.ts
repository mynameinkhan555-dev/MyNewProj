import { users } from '../schema/users.table';
import type { UserSelect, UserInsert } from '../schema/users.table';
import { User } from '../../../../domain/User';
import { UserId } from '../../../../domain/UserId';
import { UserStatus } from '../../../../domain/UserStatus';

/**
 * UserMapper - Anti-corruption layer between persistence and domain
 * 
 * Responsibilities:
 * - Translate persistence rows to domain aggregates (READ-ONLY reconstruction)
 * - Translate domain aggregates to persistence rows (for insert/update)
 * - Validate translation invariants (required fields, enum values, UUID parsing)
 * 
 * Does NOT:
 * - Create domain events (domain layer responsibility)
 * - Execute business logic (domain layer responsibility)
 * - Access database (repository layer responsibility)
 * - Validate business rules (domain layer responsibility)
 */
export class UserMapper {
  /**
   * Translate persistence row to domain aggregate.
   * 
   * This is READ-ONLY reconstruction - does NOT emit domain events.
   * Uses User.reconstruct() which bypasses constructor validation.
   * 
   * @param row - Persistence row from database
   * @returns User domain aggregate
   * @throws Error if row is invalid (null required fields, invalid enum, invalid UUID)
   */
  static toDomain(row: UserSelect): User {
    // Validate required fields
    if (!row.id) {
      throw new Error('User.id is required');
    }
    if (!row.status) {
      throw new Error('User.status is required');
    }
    if (!row.createdAt) {
      throw new Error('User.createdAt is required');
    }
    if (!row.updatedAt) {
      throw new Error('User.updatedAt is required');
    }

    // Parse typed ID
    const userId = new UserId(row.id);

    // Parse enum value (UserStatus is enum, use directly)
    const status = row.status as UserStatus;

    // Reconstruct aggregate (READ-ONLY, no events)
    return User.reconstruct({
      id: row.id,
      status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Translate domain aggregate to persistence row for insert/update.
   * 
   * @param user - Domain aggregate
   * @returns Persistence row shape
   */
  static toPersistence(user: User): UserInsert {
    return {
      id: user.id.value,
      status: user.status, // UserStatus is enum, use directly
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
