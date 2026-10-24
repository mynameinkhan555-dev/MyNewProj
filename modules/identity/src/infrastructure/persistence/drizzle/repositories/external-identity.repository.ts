import { eq, and } from 'drizzle-orm';
import type { IExternalIdentityRepository } from '../../../../domain/repositories/IExternalIdentityRepository';
import { ExternalIdentity } from '../../../../domain/ExternalIdentity';
import { ExternalIdentityId } from '../../../../domain/ExternalIdentityId';
import { UserId } from '../../../../domain/UserId';
import { ExternalIdentityProvider } from '../../../../domain/ExternalIdentityProvider';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { externalIdentities } from '../schema/external-identities.table';
import { ExternalIdentityMapper } from '../mappers/external-identity.mapper';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle ExternalIdentity Repository Implementation (Infrastructure Layer)
 *
 * Implements IExternalIdentityRepository port using Drizzle ORM.
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
export class DrizzleExternalIdentityRepository implements IExternalIdentityRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: ExternalIdentityId): Promise<ExternalIdentity | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return ExternalIdentityMapper.toDomain(rows[0]);
  }

  async findByUserId(userId: UserId): Promise<ExternalIdentity[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(externalIdentities)
      .where(eq(externalIdentities.userId, userId.value));

    return rows.map(ExternalIdentityMapper.toDomain);
  }

  async findByProviderSubject(
    provider: ExternalIdentityProvider,
    providerSubject: string
  ): Promise<ExternalIdentity | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(externalIdentities)
      .where(
        and(
          eq(externalIdentities.provider, provider.value),
          eq(externalIdentities.providerSubject, providerSubject)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return ExternalIdentityMapper.toDomain(rows[0]);
  }

  async insert(externalIdentity: ExternalIdentity): Promise<void> {
    const db = this.context.getTransaction();
    const row = ExternalIdentityMapper.toPersistence(externalIdentity);
    await db.insert(externalIdentities).values(row);
  }

  async update(externalIdentity: ExternalIdentity): Promise<void> {
    const db = this.context.getTransaction();
    const row = ExternalIdentityMapper.toPersistence(externalIdentity);
    const result = await db
      .update(externalIdentities)
      .set(row)
      .where(eq(externalIdentities.id, externalIdentity.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`ExternalIdentity not found: ${externalIdentity.id.value}`);
    }
  }

  async delete(id: ExternalIdentityId): Promise<void> {
    const db = this.context.getTransaction();
    const result = await db
      .delete(externalIdentities)
      .where(eq(externalIdentities.id, id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`ExternalIdentity not found: ${id.value}`);
    }
  }
}
