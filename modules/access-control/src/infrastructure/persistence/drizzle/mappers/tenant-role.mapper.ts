import { TenantRole } from '@workspace/access-control/domain/role/TenantRole.js';
import type { RoleStatus } from '@workspace/access-control/domain/role/index.js';
import type { NewTenantRole } from '../schema/tenant-roles.table.js';

export function tenantRoleToDb(tenantRole: TenantRole): NewTenantRole {
  return {
    id: tenantRole.id.value,
    tenantId: tenantRole.tenantId.value,
    key: tenantRole.key.value,
    status: tenantRole.status as string,
    displayName: tenantRole.displayName,
    description: tenantRole.description,
    createdAt: tenantRole.createdAt,
    updatedAt: tenantRole.updatedAt,
    version: new Date(), // Version as timestamp
  };
}

export function dbToTenantRole(row: {
  id: string;
  tenantId: string;
  key: string;
  status: string;
  displayName: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: Date;
}): TenantRole {
  const status = row.status as RoleStatus;

  return TenantRole.reconstruct({
    id: row.id,
    tenantId: row.tenantId,
    key: row.key,
    status,
    displayName: row.displayName,
    description: row.description || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
