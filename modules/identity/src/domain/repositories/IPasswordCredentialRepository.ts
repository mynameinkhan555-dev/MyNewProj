import { PasswordCredentialId } from '../PasswordCredentialId.js';
import { UserId } from '../UserId.js';
import { PasswordCredential } from '../PasswordCredential.js';

/**
 * PasswordCredential Repository Port (Domain Layer)
 * 
 * Contract for PasswordCredential aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzlePasswordCredentialRepository).
 */
export interface IPasswordCredentialRepository {
  /**
   * Find password credential by ID.
   * 
   * @param id - PasswordCredential ID
   * @returns PasswordCredential or null if not found
   */
  findById(id: PasswordCredentialId): Promise<PasswordCredential | null>;

  /**
   * Find password credential by user ID.
   * 
   * @param userId - User ID
   * @returns PasswordCredential or null if not found
   */
  findByUserId(userId: UserId): Promise<PasswordCredential | null>;

  /**
   * Insert new password credential to persistence.
   * 
   * @param passwordCredential - PasswordCredential aggregate to insert
   * @throws PersistenceError on constraint violation (e.g., duplicate password for user)
   */
  insert(passwordCredential: PasswordCredential): Promise<void>;

  /**
   * Update existing password credential in persistence.
   * 
   * @param passwordCredential - PasswordCredential aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(passwordCredential: PasswordCredential): Promise<void>;

  /**
   * Delete password credential from persistence (physical delete).
   * 
   * Used for password reset scenarios where old password is physically removed.
   * 
   * @param id - PasswordCredential ID
   */
  delete(id: PasswordCredentialId): Promise<void>;
}
