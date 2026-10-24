import { Tenant } from '../../../../domain/Tenant';
import type { TenantSelect, TenantInsert } from '../schema/tenants.table';

/**
 * Mapper between Tenant domain entity and persistence model
 */
export class TenantMapper {
  static toDomain(row: TenantSelect): Tenant {
    return Tenant.reconstruct({
      id: row.id,
      name: row.name,
      status: row.status as any, // TenantStatus enum
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(tenant: Tenant): TenantInsert {
    return {
      id: tenant.id.value,
      name: tenant.name,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
