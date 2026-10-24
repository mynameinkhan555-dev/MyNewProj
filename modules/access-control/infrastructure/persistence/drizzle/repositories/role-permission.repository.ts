import { eq, and } from 'drizzle-orm';
import type { IRolePermissionRepository } from '../../../../src/domain/repositories/IRolePermissionRepository.js';
import { TenantRoleId } from '../../../../src/domain/role/TenantRoleId.js';
import { PermissionId } from '../../../../src/domain/permission/PermissionId.js';
import { rolePermissions } from '../schema/role-permissions.table.js';
import { RolePermissionMapper } from '../mappers/role-permission.mapper.js';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle RolePermission Repository Implementation (Infrastructure Layer)
 *
 * Implements IRolePermissionRepository port using Drizzle ORM.
 *
 * RolePermission is a relationship model (not an aggregate), so operations are:
 * - grant: INSERT
 * - revoke: DELETE
 * - findByRoleId: SELECT WHERE role_id
 * - findByPermissionId: SELECT WHERE permission_id
 * - exists: SELECT WHERE role_id AND permission_id LIMIT 1
 *
 * Transaction binding:
 * - Receives TransactionContext via constructor
 * - All operations use context.getTransaction()
 * - TransactionContext throws if inactive (enforces transaction boundary)
 *
 * Error handling:
 * - PostgreSQL constraint violations are mapped by DrizzleUnitOfWork
 * - Duplicate grant: UniqueConstraintViolation (composite PK)
 */
export class DrizzleRolePermissionRepository implements IRolePermissionRepository {
  constructor(private readonly context: TransactionContext) {}

  async findByRoleId(roleId: TenantRoleId): Promise<PermissionId[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId.value));
    return rows.map(row => new PermissionId(row.permissionId));
  }

  async findByPermissionId(permissionId: PermissionId): Promise<TenantRoleId[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.permissionId, permissionId.value));
    return rows.map(row => new TenantRoleId(row.roleId));
  }

  async exists(roleId: TenantRoleId, permissionId: PermissionId): Promise<boolean> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId.value),
          eq(rolePermissions.permissionId, permissionId.value)
        )
      )
      .limit(1);
    return rows.length > 0;
  }

  async grant(roleId: TenantRoleId, permissionId: PermissionId): Promise<void> {
    const db = this.context.getTransaction();
    const row = RolePermissionMapper.toPersistence(roleId, permissionId, new Date());
    await db.insert(rolePermissions).values(row);
  }

  async revoke(roleId: TenantRoleId, permissionId: PermissionId): Promise<void> {
    const db = this.context.getTransaction();
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId.value),
          eq(rolePermissions.permissionId, permissionId.value)
        )
      );
  }
}
