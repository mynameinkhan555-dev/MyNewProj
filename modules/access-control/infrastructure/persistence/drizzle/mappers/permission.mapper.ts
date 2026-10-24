import { Permission } from '../../../../src/domain/permission/Permission.js';
import type { PermissionSelect, PermissionInsert } from '../schema/permissions.table.js';

/**
 * Mapper between Permission domain entity and persistence model
 */
export class PermissionMapper {
  static toDomain(row: PermissionSelect): Permission {
    return Permission.reconstruct({
      id: row.id,
      key: row.key,
      scope: row.scope as any, // PermissionScope enum
      status: row.status as any, // PermissionStatus enum
      displayName: row.displayName,
      description: row.description ?? '',
      metadata: row.metadata ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(permission: Permission): PermissionInsert {
    return {
      id: permission.id.value,
      key: permission.key.value,
      scope: permission.scope,
      displayName: permission.displayName,
      description: permission.description,
      metadata: permission.metadata,
      status: permission.status,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
