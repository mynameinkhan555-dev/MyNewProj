import { eq, and, inArray } from 'drizzle-orm';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { permissions } from '../schema/permissions.table';
import { Permission } from '@workspace/access-control/domain/permission/Permission';
import { PermissionId } from '@workspace/access-control/domain/permission/PermissionId';
import type { PermissionScope } from '@workspace/access-control/domain/permission/PermissionScope';
import type { IPermissionRepository } from '@workspace/access-control/domain/repositories/IPermissionRepository';
import { permissionToDb, dbToPermission } from '../mappers/permission.mapper';

export class DrizzlePermissionRepository implements IPermissionRepository {
  constructor(private readonly context: TransactionContext) {}

  private get db() {
    return this.context.getTransaction();
  }

  async findById(id: PermissionId): Promise<Permission | null> {
    const rows = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return dbToPermission(rows[0]);
  }

  async findByIds(ids: PermissionId[]): Promise<Permission[]> {
    if (ids.length === 0) {
      return [];
    }

    const idValues = ids.map((id) => id.value);
    const rows = await this.db
      .select()
      .from(permissions)
      .where(inArray(permissions.id, idValues));

    return rows.map((row: any) => dbToPermission(row));
  }

  async findByKey(key: string): Promise<Permission | null> {
    const rows = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.key, key))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return dbToPermission(rows[0]);
  }

  async findAll(): Promise<Permission[]> {
    const rows = await this.db.select().from(permissions);
    return rows.map((row: any) => dbToPermission(row));
  }

  async findByScope(scope: PermissionScope): Promise<Permission[]> {
    const rows = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.scope, scope as string));

    return rows.map((row: any) => dbToPermission(row));
  }

  async insert(permission: Permission): Promise<void> {
    const dbPermission = permissionToDb(permission);
    await this.db.insert(permissions).values(dbPermission);
  }

  async update(permission: Permission): Promise<void> {
    const dbPermission = permissionToDb(permission);
    await this.db
      .update(permissions)
      .set(dbPermission)
      .where(eq(permissions.id, permission.id.value));
  }
}
