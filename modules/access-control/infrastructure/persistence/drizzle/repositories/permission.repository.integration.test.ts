/**
 * PermissionRepository Integration Tests
 *
 * Integration tests with real PostgreSQL to qualify PermissionRepository.
 *
 * Test coverage:
 * 01 insert - valid Permission, duplicate key constraint
 * 02 findById - existing, missing
 * 03 findByKey - existing, missing
 * 04 findAll - existing, empty
 * 05 findByScope - TENANT, PLATFORM
 * 06 update - existing, missing
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DrizzleUnitOfWork } from '@workspace/platform-database/unitOfWork';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { createDatabaseClient } from '@workspace/platform-database/drizzle-client';
import { DrizzlePermissionRepository } from './permission.repository.js';
import { Permission } from '../../../../src/domain/permission/Permission.js';
import { PermissionId } from '../../../../src/domain/permission/PermissionId.js';
import { UniqueConstraintViolation, PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import * as accessControlSchema from '../schema/index.js';
import { permissions } from '../schema/index.js';

describe('DrizzlePermissionRepository — PostgreSQL Integration', () => {
  let db: any;
  let uow: DrizzleUnitOfWork;
  let repository: DrizzlePermissionRepository;

  beforeAll(() => {
    db = createDatabaseClient(accessControlSchema);
  });

  beforeEach(() => {
    uow = new DrizzleUnitOfWork(db);
    const context = uow.getContext();
    repository = new DrizzlePermissionRepository(context);
  });

  afterEach(async () => {
    // Cleanup test data
    await db.delete(permissions);
  });

  describe('01 insert', () => {
    it('should insert a new permission', async () => {
      const permissionId = new PermissionId();
      const now = new Date();
      const permission = Permission.reconstruct({
        id: permissionId.value,
        key: 'user.read',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Read User',
        description: 'Can read user information',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(permission);

        const found = await repository.findById(permissionId);
        expect(found).not.toBeNull();
        expect(found?.id.value).toBe(permissionId.value);
        expect(found?.key.value).toBe('user.read');
        expect(found?.scope).toBe('TENANT');
        expect(found?.status).toBe('ACTIVE');
      });
    });

    it('should throw UniqueConstraintViolation for duplicate key', async () => {
      const permissionId1 = new PermissionId();
      const permissionId2 = new PermissionId();
      const now = new Date();

      const permission1 = Permission.reconstruct({
        id: permissionId1.value,
        key: 'duplicate.key',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Duplicate Key',
        description: 'Test duplicate key',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      const permission2 = Permission.reconstruct({
        id: permissionId2.value,
        key: 'duplicate.key',
        scope: 'PLATFORM',
        status: 'ACTIVE',
        displayName: 'Duplicate Key 2',
        description: 'Test duplicate key 2',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      // First transaction: insert first permission
      await uow.execute(async () => {
        await repository.insert(permission1);
      });

      // Second transaction: try to insert second permission with same key
      const uow2 = new DrizzleUnitOfWork(db);
      const context2 = uow2.getContext();
      const repository2 = new DrizzlePermissionRepository(context2);
      await expect(
        uow2.execute(async () => {
          await repository2.insert(permission2);
        })
      ).rejects.toThrow(UniqueConstraintViolation);
    });
  });

  describe('02 findById', () => {
    it('should find permission by ID', async () => {
      const permissionId = new PermissionId();
      const now = new Date();
      const permission = Permission.reconstruct({
        id: permissionId.value,
        key: 'user.write',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Write User',
        description: 'Can write user information',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(permission);

        const found = await repository.findById(permissionId);
        expect(found).not.toBeNull();
        expect(found?.id.value).toBe(permissionId.value);
      });
    });

    it('should return null for non-existent ID', async () => {
      const permissionId = new PermissionId();

      await uow.execute(async () => {
        const found = await repository.findById(permissionId);
        expect(found).toBeNull();
      });
    });
  });

  describe('03 findByKey', () => {
    it('should find permission by key', async () => {
      const permissionId = new PermissionId();
      const now = new Date();
      const permission = Permission.reconstruct({
        id: permissionId.value,
        key: 'tenant.admin',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Tenant Admin',
        description: 'Can administer tenant',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(permission);

        const found = await repository.findByKey('tenant.admin');
        expect(found).not.toBeNull();
        expect(found?.key.value).toBe('tenant.admin');
      });
    });

    it('should return null for non-existent key', async () => {
      await uow.execute(async () => {
        const found = await repository.findByKey('nonexistent.key');
        expect(found).toBeNull();
      });
    });
  });

  describe('04 findAll', () => {
    it('should find all permissions', async () => {
      const now = new Date();

      const permission1 = Permission.reconstruct({
        id: new PermissionId().value,
        key: 'perm1',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Permission 1',
        description: 'Test permission 1',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      const permission2 = Permission.reconstruct({
        id: new PermissionId().value,
        key: 'perm2',
        scope: 'PLATFORM',
        status: 'ACTIVE',
        displayName: 'Permission 2',
        description: 'Test permission 2',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(permission1);
        await repository.insert(permission2);

        const found = await repository.findAll();
        expect(found).toHaveLength(2);
      });
    });

    it('should return empty array when no permissions exist', async () => {
      await uow.execute(async () => {
        const found = await repository.findAll();
        expect(found).toHaveLength(0);
      });
    });
  });

  describe('05 findByScope', () => {
    it('should find permissions by TENANT scope', async () => {
      const now = new Date();

      const permission1 = Permission.reconstruct({
        id: new PermissionId().value,
        key: 'tenant.perm1',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Tenant Permission 1',
        description: 'Test tenant permission',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      const permission2 = Permission.reconstruct({
        id: new PermissionId().value,
        key: 'platform.perm1',
        scope: 'PLATFORM',
        status: 'ACTIVE',
        displayName: 'Platform Permission 1',
        description: 'Test platform permission',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(permission1);
        await repository.insert(permission2);

        const found = await repository.findByScope('TENANT');
        expect(found).toHaveLength(1);
        expect(found[0].scope).toBe('TENANT');
      });
    });

    it('should find permissions by PLATFORM scope', async () => {
      const now = new Date();

      const permission1 = Permission.reconstruct({
        id: new PermissionId().value,
        key: 'tenant.perm2',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Tenant Permission 2',
        description: 'Test tenant permission',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      const permission2 = Permission.reconstruct({
        id: new PermissionId().value,
        key: 'platform.perm2',
        scope: 'PLATFORM',
        status: 'ACTIVE',
        displayName: 'Platform Permission 2',
        description: 'Test platform permission',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(permission1);
        await repository.insert(permission2);

        const found = await repository.findByScope('PLATFORM');
        expect(found).toHaveLength(1);
        expect(found[0].scope).toBe('PLATFORM');
      });
    });

    it('should return empty array for scope with no permissions', async () => {
      await uow.execute(async () => {
        const found = await repository.findByScope('TENANT');
        expect(found).toHaveLength(0);
      });
    });
  });

  describe('06 update', () => {
    it('should update an existing permission', async () => {
      const permissionId = new PermissionId();
      const now = new Date();
      const permission = Permission.reconstruct({
        id: permissionId.value,
        key: 'user.update',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Update User',
        description: 'Can update user information',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(permission);

        const clock = { now: () => new Date() };
        const result = permission.updateDisplay(
          'Updated Display Name',
          'Updated description',
          { updated: true },
          clock
        );
        expect(result.isOk()).toBe(true);
        await repository.update(permission);

        const found = await repository.findById(permissionId);
        expect(found?.displayName).toBe('Updated Display Name');
        expect(found?.description).toBe('Updated description');
      });
    });

    it('should throw PersistenceNotFoundError when updating non-existent permission', async () => {
      const permissionId = new PermissionId();
      const now = new Date();
      const permission = Permission.reconstruct({
        id: permissionId.value,
        key: 'nonexistent',
        scope: 'TENANT',
        status: 'ACTIVE',
        displayName: 'Nonexistent',
        description: 'Test',
        metadata: {},
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await expect(repository.update(permission)).rejects.toThrow(PersistenceNotFoundError);
      });
    });
  });
});
