import { eq } from 'drizzle-orm';
import type { IPasswordCredentialRepository } from '../../../../domain/repositories/IPasswordCredentialRepository';
import { PasswordCredential } from '../../../../domain/PasswordCredential';
import { PasswordCredentialId } from '../../../../domain/PasswordCredentialId';
import { UserId } from '../../../../domain/UserId';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { passwordCredentials } from '../schema/password-credentials.table';
import { PasswordCredentialMapper } from '../mappers/password-credential.mapper';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle PasswordCredential Repository Implementation (Infrastructure Layer)
 *
 * Implements IPasswordCredentialRepository port using Drizzle ORM.
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
export class DrizzlePasswordCredentialRepository implements IPasswordCredentialRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: PasswordCredentialId): Promise<PasswordCredential | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(passwordCredentials)
      .where(eq(passwordCredentials.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return PasswordCredentialMapper.toDomain(rows[0]);
  }

  async findByUserId(userId: UserId): Promise<PasswordCredential | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(passwordCredentials)
      .where(eq(passwordCredentials.userId, userId.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return PasswordCredentialMapper.toDomain(rows[0]);
  }

  async insert(passwordCredential: PasswordCredential): Promise<void> {
    const db = this.context.getTransaction();
    const row = PasswordCredentialMapper.toPersistence(passwordCredential);
    await db.insert(passwordCredentials).values(row);
  }

  async update(passwordCredential: PasswordCredential): Promise<void> {
    const db = this.context.getTransaction();
    const row = PasswordCredentialMapper.toPersistence(passwordCredential);
    const result = await db
      .update(passwordCredentials)
      .set(row)
      .where(eq(passwordCredentials.id, passwordCredential.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`PasswordCredential not found: ${passwordCredential.id.value}`);
    }
  }

  async delete(id: PasswordCredentialId): Promise<void> {
    const db = this.context.getTransaction();
    const result = await db
      .delete(passwordCredentials)
      .where(eq(passwordCredentials.id, id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`PasswordCredential not found: ${id.value}`);
    }
  }
}
