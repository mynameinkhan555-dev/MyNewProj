import { eq, and } from 'drizzle-orm';
import type { IUserTenantMembershipRepository } from '../../../../domain/repositories/IUserTenantMembershipRepository.js';
import { UserTenantMembership } from '../../../../domain/UserTenantMembership.js';
import { UserTenantMembershipId } from '../../../../domain/UserTenantMembershipId.js';
import { UserId } from '@workspace/identity/domain';
import { TenantId } from '../../../../domain/TenantId.js';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { userTenantMemberships } from '../schema/user-tenant-memberships.table';
import { UserTenantMembershipMapper } from '../mappers/user-tenant-membership.mapper';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

export class DrizzleUserTenantMembershipRepository implements IUserTenantMembershipRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: UserTenantMembershipId): Promise<UserTenantMembership | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(userTenantMemberships)
      .where(eq(userTenantMemberships.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return UserTenantMembershipMapper.toDomain(rows[0]);
  }

  async findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<UserTenantMembership | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(userTenantMemberships)
      .where(
        and(
          eq(userTenantMemberships.userId, userId.value),
          eq(userTenantMemberships.tenantId, tenantId.value)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return UserTenantMembershipMapper.toDomain(rows[0]);
  }

  async findByUserId(userId: UserId): Promise<UserTenantMembership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(userTenantMemberships)
      .where(eq(userTenantMemberships.userId, userId.value));

    return rows.map((row: any) => UserTenantMembershipMapper.toDomain(row));
  }

  async findByTenantId(tenantId: TenantId): Promise<UserTenantMembership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(userTenantMemberships)
      .where(eq(userTenantMemberships.tenantId, tenantId.value));

    return rows.map((row: any) => UserTenantMembershipMapper.toDomain(row));
  }

  async findActiveByUserId(userId: UserId): Promise<UserTenantMembership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(userTenantMemberships)
      .where(
        and(
          eq(userTenantMemberships.userId, userId.value),
          eq(userTenantMemberships.isActive, true)
        )
      );

    return rows.map((row: any) => UserTenantMembershipMapper.toDomain(row));
  }

  async findActiveByTenantId(tenantId: TenantId): Promise<UserTenantMembership[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(userTenantMemberships)
      .where(
        and(
          eq(userTenantMemberships.tenantId, tenantId.value),
          eq(userTenantMemberships.isActive, true)
        )
      );

    return rows.map((row: any) => UserTenantMembershipMapper.toDomain(row));
  }

  async insert(membership: UserTenantMembership): Promise<void> {
    const db = this.context.getTransaction();
    const data = UserTenantMembershipMapper.toPersistence(membership);
    await db.insert(userTenantMemberships).values(data);
  }

  async update(membership: UserTenantMembership): Promise<void> {
    const db = this.context.getTransaction();
    const data = UserTenantMembershipMapper.toPersistence(membership);
    const result = await db
      .update(userTenantMemberships)
      .set(data)
      .where(eq(userTenantMemberships.id, membership.id.value));

    if (result.rowCount === 0) {
      throw new PersistenceNotFoundError(`UserTenantMembership not found: ${membership.id.value}`);
    }
  }

  async delete(id: UserTenantMembershipId): Promise<void> {
    const db = this.context.getTransaction();
    const result = await db
      .delete(userTenantMemberships)
      .where(eq(userTenantMemberships.id, id.value));

    if (result.rowCount === 0) {
      throw new PersistenceNotFoundError(`UserTenantMembership not found: ${id.value}`);
    }
  }
}
