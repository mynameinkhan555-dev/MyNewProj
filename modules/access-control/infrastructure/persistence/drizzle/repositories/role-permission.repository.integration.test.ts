/**
 * RolePermissionRepository Integration Tests
 *
 * Integration tests with real PostgreSQL to qualify RolePermissionRepository.
 *
 * Test coverage:
 * 01 grant - valid role-permission relationship, duplicate constraint
 * 02 revoke - delete existing relationship
 * 03 findByRoleId - existing, empty
 * 04 findByPermissionId - existing, empty
 * 05 exists - true, false
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DrizzleUnitOfWork } from '@workspace/platform-database/unitOfWork';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { createDatabaseClient } from '@workspace/platform-database/drizzle-client';
import { DrizzleRolePermissionRepository } from './role-permission.repository.js';
import { TenantRoleId } from '../../../../src/domain/role/TenantRoleId.js';
import { PermissionId } from '../../../../src/domain/permission/PermissionId.js';
import { UniqueConstraintViolation } from '@workspace/platform-database/persistence';
import { sql } from '@workspace/platform-database/drizzle-pg-core';
import * as accessControlSchema from '../schema/index.js';
import { rolePermissions, tenantRoles, permissions } from '../schema/index.js';

describe('DrizzleRolePermissionRepository — PostgreSQL Integration', () => {
  let db: any;
  let uow: DrizzleUnitOfWork;
  let repository: DrizzleRolePermissionRepository;

  beforeAll(() => {
    db = createDatabaseClient(accessControlSchema);
  });

  beforeEach(() => {
    uow = new DrizzleUnitOfWork(db);
    const context = uow.getContext();
    repository = new DrizzleRolePermissionRepository(context);
  });

  afterEach(async () => {
    // Cleanup in FK order: children first, then parents
    await db.delete(rolePermissions);
    await db.delete(tenantRoles);
    await db.delete(permissions);
    await db.execute(sql`DELETE FROM tenants`);
  });

  // Helper function to create parent fixtures
  async function createParentFixtures(roleId?: string, permissionId?: string) {
    const tenantId = crypto.randomUUID();
    const rid = roleId || crypto.randomUUID();
    const pid = permissionId || crypto.randomUUID();
    const now = new Date();
    const tenantName = `Test Tenant ${crypto.randomUUID()}`;

    // Use raw SQL to insert tenant (for tenant_roles FK)
    await db.execute(sql`INSERT INTO tenants (id, name, status, created_at, updated_at) VALUES (${tenantId}, ${tenantName}, 'ACTIVE', ${now.toISOString()}, ${now.toISOString()})`);

    await db.insert(tenantRoles).values({
      id: rid,
      tenantId: tenantId,
      key: 'test-role',
      name: 'Test Role',
      displayName: 'Test Role Display',
      description: 'Test Role Description',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(permissions).values({
      id: pid,
      key: 'test.permission',
      name: 'Test Permission',
      displayName: 'Test Permission Display',
      description: 'Test Permission Description',
      metadata: {},
      scope: 'TENANT',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });

    return { roleId: rid, permissionId: pid };
  }

  describe('01 grant', () => {
    it('should grant a permission to a role', async () => {
      const { roleId, permissionId } = await createParentFixtures();

      await uow.execute(async () => {
        await repository.grant(new TenantRoleId(roleId), new PermissionId(permissionId));

        const exists = await repository.exists(new TenantRoleId(roleId), new PermissionId(permissionId));
        expect(exists).toBe(true);
      });
    });

    it('should throw UniqueConstraintViolation for duplicate grant', async () => {
      const { roleId, permissionId } = await createParentFixtures();

      // First transaction: grant permission
      await uow.execute(async () => {
        await repository.grant(new TenantRoleId(roleId), new PermissionId(permissionId));
      });

      // Second transaction: try to grant same permission again
      const uow2 = new DrizzleUnitOfWork(db);
      const context2 = uow2.getContext();
      const repository2 = new DrizzleRolePermissionRepository(context2);
      await expect(
        uow2.execute(async () => {
          await repository2.grant(new TenantRoleId(roleId), new PermissionId(permissionId));
        })
      ).rejects.toThrow(UniqueConstraintViolation);
    });
  });

  describe('02 revoke', () => {
    it('should revoke a permission from a role', async () => {
      const { roleId, permissionId } = await createParentFixtures();

      await uow.execute(async () => {
        await repository.grant(new TenantRoleId(roleId), new PermissionId(permissionId));

        await repository.revoke(new TenantRoleId(roleId), new PermissionId(permissionId));

        const exists = await repository.exists(new TenantRoleId(roleId), new PermissionId(permissionId));
        expect(exists).toBe(false);
      });
    });

    it('should not throw when revoking non-existent relationship', async () => {
      const roleId = new TenantRoleId();
      const permissionId = new PermissionId();

      await uow.execute(async () => {
        await expect(repository.revoke(roleId, permissionId)).resolves.not.toThrow();
      });
    });
  });

  describe('03 findByRoleId', () => {
    it('should find all permissions for a role', async () => {
      const { roleId } = await createParentFixtures();
      const permissionId1 = crypto.randomUUID();
      const permissionId2 = crypto.randomUUID();
      const now = new Date();

      // Create additional permissions
      await db.insert(permissions).values([
        {
          id: permissionId1,
          key: 'test.permission1',
          name: 'Test Permission 1',
          displayName: 'Test Permission 1 Display',
          description: 'Test Permission 1 Description',
          metadata: {},
          scope: 'TENANT',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: permissionId2,
          key: 'test.permission2',
          name: 'Test Permission 2',
          displayName: 'Test Permission 2 Display',
          description: 'Test Permission 2 Description',
          metadata: {},
          scope: 'TENANT',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await uow.execute(async () => {
        await repository.grant(new TenantRoleId(roleId), new PermissionId(permissionId1));
        await repository.grant(new TenantRoleId(roleId), new PermissionId(permissionId2));

        const found = await repository.findByRoleId(new TenantRoleId(roleId));
        expect(found).toHaveLength(2);
        expect(found[0].value).toBe(permissionId1);
        expect(found[1].value).toBe(permissionId2);
      });
    });

    it('should return empty array for role with no permissions', async () => {
      const roleId = new TenantRoleId();

      await uow.execute(async () => {
        const found = await repository.findByRoleId(roleId);
        expect(found).toHaveLength(0);
      });
    });
  });

  describe('04 findByPermissionId', () => {
    it('should find all roles that have a permission', async () => {
      const { permissionId } = await createParentFixtures();
      const roleId1 = crypto.randomUUID();
      const roleId2 = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const now = new Date();

      // Create tenant for additional roles
      await db.execute(sql`INSERT INTO tenants (id, name, status, created_at, updated_at) VALUES (${tenantId}, 'Test Tenant 2', 'ACTIVE', ${now.toISOString()}, ${now.toISOString()})`);

      // Create additional roles
      await db.insert(tenantRoles).values([
        {
          id: roleId1,
          tenantId: tenantId,
          key: 'test-role1',
          name: 'Test Role 1',
          displayName: 'Test Role 1 Display',
          description: 'Test Role 1 Description',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: roleId2,
          tenantId: tenantId,
          key: 'test-role2',
          name: 'Test Role 2',
          displayName: 'Test Role 2 Display',
          description: 'Test Role 2 Description',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await uow.execute(async () => {
        await repository.grant(new TenantRoleId(roleId1), new PermissionId(permissionId));
        await repository.grant(new TenantRoleId(roleId2), new PermissionId(permissionId));

        const found = await repository.findByPermissionId(new PermissionId(permissionId));
        expect(found).toHaveLength(2);
        expect(found[0].value).toBe(roleId1);
        expect(found[1].value).toBe(roleId2);
      });
    });

    it('should return empty array for permission not assigned to any role', async () => {
      const permissionId = new PermissionId();

      await uow.execute(async () => {
        const found = await repository.findByPermissionId(permissionId);
        expect(found).toHaveLength(0);
      });
    });
  });

  describe('05 exists', () => {
    it('should return true when relationship exists', async () => {
      const { roleId, permissionId } = await createParentFixtures();

      await uow.execute(async () => {
        await repository.grant(new TenantRoleId(roleId), new PermissionId(permissionId));

        const exists = await repository.exists(new TenantRoleId(roleId), new PermissionId(permissionId));
        expect(exists).toBe(true);
      });
    });

    it('should return false when relationship does not exist', async () => {
      const roleId = new TenantRoleId();
      const permissionId = new PermissionId();

      await uow.execute(async () => {
        const exists = await repository.exists(roleId, permissionId);
        expect(exists).toBe(false);
      });
    });
  });
});
