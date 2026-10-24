import { eq, lt } from 'drizzle-orm';
import type { ISessionRepository } from '../../../../domain/repositories/ISessionRepository';
import { Session } from '../../../../domain/Session';
import { SessionId } from '../../../../domain/SessionId';
import { UserId } from '../../../../domain/UserId';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { sessions } from '../schema/sessions.table';
import { SessionMapper } from '../mappers/session.mapper';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle Session Repository Implementation (Infrastructure Layer)
 *
 * Implements ISessionRepository port using Drizzle ORM.
 *
 * Security model:
 * - Stores only hashed refresh tokens (never plaintext)
 * - Revocation is tracked via revokedAt timestamp
 * - isValid = (revokedAt IS NULL) AND (expiresAt > NOW())
 *
 * Transaction binding:
 * - Receives TransactionContext via constructor
 * - All operations use context.getTransaction()
 * - TransactionContext throws if inactive (enforces transaction boundary)
 *
 * Error handling:
 * - PostgreSQL constraint violations are mapped by DrizzleUnitOfWork
 * - UPDATE 0 rows → NotFoundError
 */
export class DrizzleSessionRepository implements ISessionRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: SessionId): Promise<Session | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return SessionMapper.toDomain(rows[0]);
  }

  async findByUserId(userId: UserId): Promise<Session[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId.value));

    return rows.map(SessionMapper.toDomain);
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshTokenHash, refreshTokenHash))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return SessionMapper.toDomain(rows[0]);
  }

  async findExpiredSessions(now: Date): Promise<Session[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(sessions)
      .where(lt(sessions.expiresAt, now));

    return rows.map(SessionMapper.toDomain);
  }

  async insert(session: Session): Promise<void> {
    const db = this.context.getTransaction();
    const row = SessionMapper.toPersistence(session);
    await db.insert(sessions).values(row);
  }

  async update(session: Session): Promise<void> {
    const db = this.context.getTransaction();
    const row = SessionMapper.toPersistence(session);
    const result = await db
      .update(sessions)
      .set(row)
      .where(eq(sessions.id, session.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`Session not found: ${session.id.value}`);
    }
  }

  async delete(id: SessionId): Promise<void> {
    const db = this.context.getTransaction();
    const result = await db
      .delete(sessions)
      .where(eq(sessions.id, id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`Session not found: ${id.value}`);
    }
  }
}
