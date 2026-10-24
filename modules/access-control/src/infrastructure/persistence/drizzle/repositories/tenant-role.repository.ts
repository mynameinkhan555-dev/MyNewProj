import { eq, and } from 'drizzle-orm';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { tenantRoles } from '../schema/tenant-roles.table';
import { TenantRole } from '@workspace/access-control/domain/role/TenantRole';
import { TenantRoleId } from '@workspace/access-control/domain/role/TenantRoleId';
import type { TenantId } from '@workspace/tenant';
import type { ITenantRoleRepository } from '@workspace/access-control/domain/repositories/ITenantRoleRepository';
import { tenantRoleToDb, dbToTenantRole } from '../mappers/tenant-role.mapper';

export class DrizzleTenantRoleRepository implements ITenantRoleRepository {
  constructor(private readonly context: TransactionContext) {}

  private get db() {
    return this.context.getTransaction();
  }

  async findById(id: TenantRoleId): Promise<TenantRole | null> {
    const rows = await this.db
      .select()
      .from(tenantRoles)
      .where(eq(tenantRoles.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return dbToTenantRole(rows[0]);
  }

  async findByTenantAndKey(tenantId: TenantId, key: string): Promise<TenantRole | null> {
    const rows = await this.db
      .select()
      .from(tenantRoles)
      .where(and(eq(tenantRoles.tenantId, tenantId.value), eq(tenantRoles.key, key)))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return dbToTenantRole(rows[0]);
  }

  async findByTenantId(tenantId: TenantId): Promise<TenantRole[]> {
    const rows = await this.db
      .select()
      .from(tenantRoles)
      .where(eq(tenantRoles.tenantId, tenantId.value));

    return rows.map((row: any) => dbToTenantRole(row));
  }

  async insert(tenantRole: TenantRole): Promise<void> {
    const dbTenantRole = tenantRoleToDb(tenantRole);
    await this.db.insert(tenantRoles).values(dbTenantRole);
  }

  async update(tenantRole: TenantRole): Promise<void> {
    const dbTenantRole = tenantRoleToDb(tenantRole);
    await this.db
      .update(tenantRoles)
      .set(dbTenantRole)
      .where(eq(tenantRoles.id, tenantRole.id.value));
  }
}
