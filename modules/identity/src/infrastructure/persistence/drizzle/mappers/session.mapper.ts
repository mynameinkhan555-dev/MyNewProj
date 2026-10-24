import { Session } from '../../../../domain/Session';
import type { SessionSelect, SessionInsert } from '../schema/sessions.table';

/**
 * Mapper between Session domain entity and persistence model
 */
export class SessionMapper {
  static toDomain(row: SessionSelect): Session {
    return Session.reconstruct({
      id: row.id,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(session: Session): SessionInsert {
    return {
      id: session.id.value,
      userId: session.userId.value,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
