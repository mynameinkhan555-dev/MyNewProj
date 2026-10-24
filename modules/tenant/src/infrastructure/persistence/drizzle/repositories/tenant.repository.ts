import { eq } from 'drizzle-orm';
import type { ITenantRepository } from '../../../../domain/repositories/ITenantRepository';
import { Tenant } from '../../../../domain/Tenant';
import { TenantId } from '../../../../domain/TenantId';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { tenants } from '../schema/tenants.table';
import { TenantMapper } from '../mappers/tenant.mapper';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle Tenant Repository Implementation (Infrastructure Layer)
 *
 * Implements ITenantRepository port using Drizzle ORM.
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
export class DrizzleTenantRepository implements ITenantRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: TenantId): Promise<Tenant | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return TenantMapper.toDomain(rows[0]);
  }

  async findByName(name: string): Promise<Tenant | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(tenants)
      .where(eq(tenants.name, name))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return TenantMapper.toDomain(rows[0]);
  }

  async insert(tenant: Tenant): Promise<void> {
    const db = this.context.getTransaction();
    const row = TenantMapper.toPersistence(tenant);
    await db.insert(tenants).values(row);
  }

  async update(tenant: Tenant): Promise<void> {
    const db = this.context.getTransaction();
    const row = TenantMapper.toPersistence(tenant);
    const result = await db
      .update(tenants)
      .set(row)
      .where(eq(tenants.id, tenant.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError(`Tenant not found: ${tenant.id.value}`);
    }
  }
}
