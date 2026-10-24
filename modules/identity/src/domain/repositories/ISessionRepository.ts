import { SessionId } from '../SessionId.js';
import { UserId } from '../UserId.js';
import { Session } from '../Session.js';

/**
 * Session Repository Port (Domain Layer)
 * 
 * Contract for Session aggregate persistence operations.
 * Implemented by infrastructure layer (DrizzleSessionRepository).
 */
export interface ISessionRepository {
  /**
   * Find session by ID.
   * 
   * @param id - Session ID
   * @returns Session or null if not found
   */
  findById(id: SessionId): Promise<Session | null>;

  /**
   * Find all sessions for a user.
   * 
   * @param userId - User ID
   * @returns Array of Session
   */
  findByUserId(userId: UserId): Promise<Session[]>;

  /**
   * Find session by refresh token hash.
   * 
   * @param refreshTokenHash - Hashed refresh token
   * @returns Session or null if not found
   */
  findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null>;

  /**
   * Find expired sessions.
   * 
   * @param now - Current timestamp
   * @returns Array of expired Session
   */
  findExpiredSessions(now: Date): Promise<Session[]>;

  /**
   * Insert new session to persistence.
   * 
   * @param session - Session aggregate to insert
   * @throws PersistenceError on constraint violation
   */
  insert(session: Session): Promise<void>;

  /**
   * Update existing session in persistence.
   * 
   * @param session - Session aggregate to update
   * @throws PersistenceError on constraint violation
   */
  update(session: Session): Promise<void>;

  /**
   * Delete session from persistence (physical delete).
   * 
   * Used for session cleanup scenarios.
   * 
   * @param id - Session ID
   */
  delete(id: SessionId): Promise<void>;
}
