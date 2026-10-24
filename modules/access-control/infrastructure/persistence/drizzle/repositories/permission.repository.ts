import { eq } from 'drizzle-orm';
import type { IPermissionRepository } from '../../../../src/domain/repositories/IPermissionRepository.js';
import { Permission } from '../../../../src/domain/permission/Permission.js';
import { PermissionId } from '../../../../src/domain/permission/PermissionId.js';
import { PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { permissions } from '../schema/permissions.table.js';
import { PermissionMapper } from '../mappers/permission.mapper.js';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';

/**
 * Drizzle Permission Repository Implementation (Infrastructure Layer)
 *
 * Implements IPermissionRepository port using Drizzle ORM.
 *
 * Transaction binding:
 * - Receives TransactionContext via constructor
 * - All operations use context.getTransaction()
 * - TransactionContext throws if inactive (enforces transaction boundary)
 *
 * Error handling:
 * - PostgreSQL constraint violations are mapped by DrizzleUnitOfWork
 * - UPDATE 0 rows → PersistenceNotFoundError
 */
export class DrizzlePermissionRepository implements IPermissionRepository {
  constructor(private readonly context: TransactionContext) {}

  async findById(id: PermissionId): Promise<Permission | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id.value))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return PermissionMapper.toDomain(rows[0]);
  }

  async findByKey(key: string): Promise<Permission | null> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(permissions)
      .where(eq(permissions.key, key))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return PermissionMapper.toDomain(rows[0]);
  }

  async findAll(): Promise<Permission[]> {
    const db = this.context.getTransaction();
    const rows = await db.select().from(permissions);
    return rows.map(PermissionMapper.toDomain);
  }

  async findByScope(scope: any): Promise<Permission[]> {
    const db = this.context.getTransaction();
    const rows = await db
      .select()
      .from(permissions)
      .where(eq(permissions.scope, scope));
    return rows.map(PermissionMapper.toDomain);
  }

  async insert(permission: Permission): Promise<void> {
    const db = this.context.getTransaction();
    const row = PermissionMapper.toPersistence(permission);
    await db.insert(permissions).values(row);
  }

  async update(permission: Permission): Promise<void> {
    const db = this.context.getTransaction();
    const row = PermissionMapper.toPersistence(permission);
    const result = await db
      .update(permissions)
      .set(row)
      .where(eq(permissions.id, permission.id.value))
      .returning();

    if (result.length === 0) {
      throw new PersistenceNotFoundError('Permission', permission.id.value);
    }
  }
}
