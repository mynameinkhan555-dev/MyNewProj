import { UserId } from '../UserId.js';
import { User } from '../User.js';

/**
 * User Repository Port (Domain Layer)
 * 
 * Contract for User aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzleUserRepository).
 */
export interface IUserRepository {
  /**
   * Find user by ID.
   * 
   * @param id - User ID
   * @returns User or null if not found
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Insert new user to persistence.
   * 
   * @param user - User aggregate to insert
   * @throws PersistenceError on constraint violation
   */
  insert(user: User): Promise<void>;

  /**
   * Update existing user in persistence.
   * 
   * @param user - User aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(user: User): Promise<void>;
}
