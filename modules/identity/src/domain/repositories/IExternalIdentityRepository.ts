import { ExternalIdentityId } from '../ExternalIdentityId.js';
import { UserId } from '../UserId.js';
import { ExternalIdentityProvider } from '../ExternalIdentityProvider.js';
import { ExternalIdentity } from '../ExternalIdentity.js';

/**
 * ExternalIdentity Repository Port (Domain Layer)
 * 
 * Contract for ExternalIdentity aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzleExternalIdentityRepository).
 */
export interface IExternalIdentityRepository {
  /**
   * Find external identity by ID.
   * 
   * @param id - ExternalIdentity ID
   * @returns ExternalIdentity or null if not found
   */
  findById(id: ExternalIdentityId): Promise<ExternalIdentity | null>;

  /**
   * Find external identity by provider and provider subject.
   * 
   * @param provider - OAuth/OIDC provider (e.g., 'google', 'github')
   * @param providerSubject - Provider's user identifier
   * @returns ExternalIdentity or null if not found
   */
  findByProviderSubject(
    provider: ExternalIdentityProvider,
    providerSubject: string,
  ): Promise<ExternalIdentity | null>;

  /**
   * Find all external identities for a user.
   * 
   * @param userId - User ID
   * @returns Array of ExternalIdentity
   */
  findByUserId(userId: UserId): Promise<ExternalIdentity[]>;

  /**
   * Insert new external identity to persistence.
   * 
   * @param externalIdentity - ExternalIdentity aggregate to insert
   * @throws PersistenceError on constraint violation (e.g., duplicate provider+subject)
   */
  insert(externalIdentity: ExternalIdentity): Promise<void>;

  /**
   * Update existing external identity in persistence.
   * 
   * @param externalIdentity - ExternalIdentity aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(externalIdentity: ExternalIdentity): Promise<void>;

  /**
   * Delete external identity from persistence (physical delete).
   * 
   * Used for account unlink scenarios where external identity is physically removed.
   * 
   * @param id - ExternalIdentity ID
   */
  delete(id: ExternalIdentityId): Promise<void>;
}
