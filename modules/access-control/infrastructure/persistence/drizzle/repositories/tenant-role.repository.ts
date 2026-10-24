import { eq, and } from 'drizzle-orm';
import type { ITenantRoleRepository } from '../../../../src/domain/repositories/ITenantRoleRepository.js';
import { TenantRole } from '../../../../src/domain/role/TenantRole.js';
import { TenantRoleId } from '../../../../src/domain/role/TenantRoleId.js';
import { TenantId } from '@workspace/tenant';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { tenantRoles } from '../schema/tenant-roles.table.js';
import { TenantRoleMapper } from '../mappers/tenant-role.mapper.js';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle TenantRole Repository Implementation (Infrastructure Layer)
 *
 * Implements ITenantRoleRepository port using Drizzle ORM.
 *
 * Transaction binding:
 * - Receives TransactionContext via constructor
 * - All operations use context.getTransaction()
 * - TransactionContext throws if inactive (enforces transaction boundary)
 *
 * Error handling:
 * - PostgreSQL constraint violations are mapped by DrizzleUnitOfWork
 * - UPDATE 0 rows → PersistenceNotFoundError
 */
export class DrizzleTenantRoleRepository implements ITenantRoleRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: TenantRoleId): Promise<TenantRole | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(tenantRoles)
      .where(eq(tenantRoles.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return TenantRoleMapper.toDomain(rows[0]);
  }

  async findByTenantAndKey(tenantId: TenantId, key: string): Promise<TenantRole | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(tenantRoles)
      .where(
        and(
          eq(tenantRoles.tenantId, tenantId.value),
          eq(tenantRoles.key, key)
        )
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return TenantRoleMapper.toDomain(rows[0]);
  }

  async findByTenantId(tenantId: TenantId): Promise<TenantRole[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(tenantRoles)
      .where(eq(tenantRoles.tenantId, tenantId.value));
    return rows.map(TenantRoleMapper.toDomain);
  }

  async insert(tenantRole: TenantRole): Promise<void> {
    const db = this.context.getTransaction();
    const row = TenantRoleMapper.toPersistence(tenantRole);
    await db.insert(tenantRoles).values(row);
  }

  async update(tenantRole: TenantRole): Promise<void> {
    const db = this.context.getTransaction();
    const row = TenantRoleMapper.toPersistence(tenantRole);
    const result = await db
      .update(tenantRoles)
      .set(row)
      .where(eq(tenantRoles.id, tenantRole.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError('TenantRole', tenantRole.id.value);
    }
  }
}
