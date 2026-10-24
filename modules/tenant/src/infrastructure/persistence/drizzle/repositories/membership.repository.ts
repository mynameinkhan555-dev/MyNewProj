import { eq, and } from 'drizzle-orm';
import type { IMembershipRepository } from '../../../../domain/repositories/IMembershipRepository';
import { Membership } from '../../../../domain/Membership';
import { MembershipId } from '../../../../domain/MembershipId';
import { UserId } from '@workspace/identity';
import { TenantId } from '../../../../domain/TenantId';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { memberships } from '../schema/memberships.table';
import { MembershipMapper } from '../mappers/membership.mapper';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle Membership Repository Implementation (Infrastructure Layer)
 *
 * Implements IMembershipRepository port using Drizzle ORM.
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
export class DrizzleMembershipRepository implements IMembershipRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: MembershipId): Promise<Membership | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(memberships)
      .where(eq(memberships.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return MembershipMapper.toDomain(rows[0]);
  }

  async findByUserId(userId: UserId): Promise<Membership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId.value));

    return rows.map(MembershipMapper.toDomain);
  }

  async findByTenantId(tenantId: TenantId): Promise<Membership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(memberships)
      .where(eq(memberships.tenantId, tenantId.value));

    return rows.map(MembershipMapper.toDomain);
  }

  async findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<Membership | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId.value),
          eq(memberships.tenantId, tenantId.value)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return MembershipMapper.toDomain(rows[0]);
  }

  async findActiveByUserId(userId: UserId): Promise<Membership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId.value),
          eq(memberships.status, 'ACTIVE')
        )
      );

    return rows.map(MembershipMapper.toDomain);
  }

  async findActiveByTenantId(tenantId: TenantId): Promise<Membership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.tenantId, tenantId.value),
          eq(memberships.status, 'ACTIVE')
        )
      );

    return rows.map(MembershipMapper.toDomain);
  }

  async insert(membership: Membership): Promise<void> {
    const db = this.context.getTransaction();
    const row = MembershipMapper.toPersistence(membership);
    await db.insert(memberships).values(row);
  }

  async update(membership: Membership): Promise<void> {
    const db = this.context.getTransaction();
    const row = MembershipMapper.toPersistence(membership);
    const result = await db
      .update(memberships)
      .set(row)
      .where(eq(memberships.id, membership.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`Membership not found: ${membership.id.value}`);
    }
  }

  async findByUserIdAndTenantId(userId: UserId, tenantId: TenantId): Promise<Membership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId.value),
          eq(memberships.tenantId, tenantId.value)
        )
      );

    return rows.map(MembershipMapper.toDomain);
  }
}
