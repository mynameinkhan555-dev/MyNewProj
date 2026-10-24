import { EmailIdentityId } from '../EmailIdentityId.js';
import { UserId } from '../UserId.js';
import { EmailIdentity } from '../EmailIdentity.js';

/**
 * EmailIdentity Repository Port (Domain Layer)
 * 
 * Contract for EmailIdentity aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzleEmailIdentityRepository).
 */
export interface IEmailIdentityRepository {
  /**
   * Find email identity by ID.
   * 
   * @param id - EmailIdentity ID
   * @returns EmailIdentity or null if not found
   */
  findById(id: EmailIdentityId): Promise<EmailIdentity | null>;

  /**
   * Find email identity by email address.
   * 
   * @param email - Email address
   * @returns EmailIdentity or null if not found
   */
  findByEmail(email: string): Promise<EmailIdentity | null>;

  /**
   * Find all email identities for a user.
   * 
   * @param userId - User ID
   * @returns Array of EmailIdentity
   */
  findByUserId(userId: UserId): Promise<EmailIdentity[]>;

  /**
   * Find primary email identity for a user.
   * 
   * @param userId - User ID
   * @returns Primary EmailIdentity or null if not found
   */
  findPrimaryByUserId(userId: UserId): Promise<EmailIdentity | null>;

  /**
   * Insert new email identity to persistence.
   * 
   * @param emailIdentity - EmailIdentity aggregate to insert
   * @throws PersistenceError on constraint violation (e.g., duplicate email)
   */
  insert(emailIdentity: EmailIdentity): Promise<void>;

  /**
   * Update existing email identity in persistence.
   * 
   * @param emailIdentity - EmailIdentity aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(emailIdentity: EmailIdentity): Promise<void>;

  /**
   * Delete email identity from persistence (physical delete).
   * 
   * Used for email change scenarios where old email is physically removed.
   * 
   * @param id - EmailIdentity ID
   */
  delete(id: EmailIdentityId): Promise<void>;
}
