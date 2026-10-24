import { eq, and } from 'drizzle-orm';
import type { IEmailIdentityRepository } from '../../../../domain/repositories/IEmailIdentityRepository';
import { EmailIdentity } from '../../../../domain/EmailIdentity';
import { EmailIdentityId } from '../../../../domain/EmailIdentityId';
import { UserId } from '../../../../domain/UserId';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { emailIdentities } from '../schema/email-identities.table';
import { EmailIdentityMapper } from '../mappers/email-identity.mapper';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle EmailIdentity Repository Implementation (Infrastructure Layer)
 *
 * Implements IEmailIdentityRepository port using Drizzle ORM.
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
export class DrizzleEmailIdentityRepository implements IEmailIdentityRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: EmailIdentityId): Promise<EmailIdentity | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(emailIdentities)
      .where(eq(emailIdentities.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return EmailIdentityMapper.toDomain(rows[0]);
  }

  async findByEmail(email: string): Promise<EmailIdentity | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(emailIdentities)
      .where(eq(emailIdentities.email, email))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return EmailIdentityMapper.toDomain(rows[0]);
  }

  async findByUserId(userId: UserId): Promise<EmailIdentity[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(emailIdentities)
      .where(eq(emailIdentities.userId, userId.value));

    return rows.map(EmailIdentityMapper.toDomain);
  }

  async findPrimaryByUserId(userId: UserId): Promise<EmailIdentity | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(emailIdentities)
      .where(
        and(
          eq(emailIdentities.userId, userId.value),
          eq(emailIdentities.primary, true)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return EmailIdentityMapper.toDomain(rows[0]);
  }

  async insert(emailIdentity: EmailIdentity): Promise<void> {
    const db = this.context.getTransaction();
    const row = EmailIdentityMapper.toPersistence(emailIdentity);
    await db.insert(emailIdentities).values(row);
  }

  async update(emailIdentity: EmailIdentity): Promise<void> {
    const db = this.context.getTransaction();
    const row = EmailIdentityMapper.toPersistence(emailIdentity);
    const result = await db
      .update(emailIdentities)
      .set(row)
      .where(eq(emailIdentities.id, emailIdentity.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`EmailIdentity not found: ${emailIdentity.id.value}`);
    }
  }

  async delete(id: EmailIdentityId): Promise<void> {
    const db = this.context.getTransaction();
    const result = await db
      .delete(emailIdentities)
      .where(eq(emailIdentities.id, id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`EmailIdentity not found: ${id.value}`);
    }
  }
}
