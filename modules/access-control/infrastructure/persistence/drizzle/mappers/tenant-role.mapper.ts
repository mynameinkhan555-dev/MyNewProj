import { TenantRole } from '../../../../src/domain/role/TenantRole.js';
import type { TenantRoleSelect, TenantRoleInsert } from '../schema/tenant-roles.table.js';

/**
 * Mapper between TenantRole domain entity and persistence model
 */
export class TenantRoleMapper {
  static toDomain(row: TenantRoleSelect): TenantRole {
    return TenantRole.reconstruct({
      id: row.id,
      tenantId: row.tenantId,
      key: row.key,
      status: row.status as any, // RoleStatus enum
      displayName: row.displayName,
      description: row.description ?? '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(tenantRole: TenantRole): TenantRoleInsert {
    return {
      id: tenantRole.id.value,
      tenantId: tenantRole.tenantId.value,
      key: tenantRole.key.value,
      displayName: tenantRole.displayName,
      description: tenantRole.description,
      status: tenantRole.status,
      createdAt: tenantRole.createdAt,
      updatedAt: tenantRole.updatedAt,
    };
  }
}
