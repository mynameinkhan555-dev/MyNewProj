import { eq, and, inArray } from 'drizzle-orm';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { rolePermissions } from '../schema/role-permissions.table';
import { TenantRoleId } from '@workspace/access-control/domain/role/TenantRoleId';
import { PermissionId } from '@workspace/access-control/domain/permission/PermissionId';
import type { IRolePermissionRepository } from '@workspace/access-control/domain/repositories/IRolePermissionRepository';

export class DrizzleRolePermissionRepository implements IRolePermissionRepository {
  constructor(private readonly context: TransactionContext) {}

  private get db() {
    return this.context.getTransaction();
  }

  async findByRoleId(roleId: TenantRoleId): Promise<PermissionId[]> {
    const rows = await this.db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId.value));

    return rows.map((row: any) => new PermissionId(row.permissionId));
  }

  async findByRoleIds(roleIds: TenantRoleId[]): Promise<PermissionId[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const idValues = roleIds.map((id) => id.value);
    const rows = await this.db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, idValues));

    return rows.map((row: any) => new PermissionId(row.permissionId));
  }

  async findByRoleAndPermission(
    roleId: TenantRoleId,
    permissionId: PermissionId,
  ): Promise<{ id: string; tenantRoleId: string; permissionId: string } | null> {
    const rows = await this.db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId.value),
          eq(rolePermissions.permissionId, permissionId.value),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return {
      id: `${rows[0].roleId}-${rows[0].permissionId}`,
      tenantRoleId: rows[0].roleId,
      permissionId: rows[0].permissionId,
    };
  }

  async findByPermissionId(permissionId: PermissionId): Promise<TenantRoleId[]> {
    const rows = await this.db
      .select({ roleId: rolePermissions.roleId })
      .from(rolePermissions)
      .where(eq(rolePermissions.permissionId, permissionId.value));

    return rows.map((row: any) => new TenantRoleId(row.roleId));
  }

  async exists(roleId: TenantRoleId, permissionId: PermissionId): Promise<boolean> {
    const rows = await this.db
      .select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId.value),
          eq(rolePermissions.permissionId, permissionId.value),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  async grant(roleId: TenantRoleId, permissionId: PermissionId): Promise<void> {
    await this.db.insert(rolePermissions).values({
      roleId: roleId.value,
      permissionId: permissionId.value,
      createdAt: new Date(),
    });
  }

  async revoke(roleId: TenantRoleId, permissionId: PermissionId): Promise<void> {
    await this.db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId.value),
          eq(rolePermissions.permissionId, permissionId.value),
        ),
      );
  }
}
