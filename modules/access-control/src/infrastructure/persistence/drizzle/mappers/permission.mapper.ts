import { Permission } from '@workspace/access-control/domain/permission/Permission.js';
import type { PermissionScope, PermissionStatus } from '@workspace/access-control/domain/permission/index.js';
import type { NewPermission } from '../schema/permissions.table.js';

export function permissionToDb(permission: Permission): NewPermission {
  return {
    id: permission.id.value,
    key: permission.key.value,
    scope: permission.scope as string,
    status: permission.status as string,
    displayName: permission.displayName,
    description: permission.description,
    metadata: JSON.stringify(permission.metadata),
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
    version: new Date(), // Version as timestamp
  };
}

export function dbToPermission(row: {
  id: string;
  key: string;
  scope: string;
  status: string;
  displayName: string;
  description: string | null;
  metadata: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: Date;
}): Permission {
  const scope = row.scope as PermissionScope;
  const status = row.status as PermissionStatus;
  const metadata = row.metadata ? JSON.parse(row.metadata) : {};

  return Permission.reconstruct({
    id: row.id,
    key: row.key,
    scope,
    status,
    displayName: row.displayName,
    description: row.description || '',
    metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
