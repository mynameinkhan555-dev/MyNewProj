/**
 * TenantRoleRepository Integration Tests
 *
 * Integration tests with real PostgreSQL to qualify TenantRoleRepository.
 *
 * Test coverage:
 * 01 insert - valid TenantRole, duplicate tenant+key constraint
 * 02 findById - existing, missing
 * 03 findByTenantAndKey - existing, missing
 * 04 findByTenantId - existing, empty
 * 05 update - existing, missing
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DrizzleUnitOfWork } from '@workspace/platform-database/unitOfWork';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { createDatabaseClient } from '@workspace/platform-database/drizzle-client';
import { DrizzleTenantRoleRepository } from './tenant-role.repository.js';
import { TenantRole } from '../../../../src/domain/role/TenantRole.js';
import { TenantRoleId } from '../../../../src/domain/role/TenantRoleId.js';
import { TenantId } from '@workspace/tenant';
import { UniqueConstraintViolation, PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { sql } from '@workspace/platform-database/drizzle-pg-core';
import * as accessControlSchema from '../schema/index.js';
import { tenantRoles } from '../schema/index.js';

describe('DrizzleTenantRoleRepository — PostgreSQL Integration', () => {
  let db: any;
  let uow: DrizzleUnitOfWork;
  let repository: DrizzleTenantRoleRepository;

  beforeAll(() => {
    db = createDatabaseClient(accessControlSchema);
  });

  beforeEach(() => {
    uow = new DrizzleUnitOfWork(db);
    const context = uow.getContext();
    repository = new DrizzleTenantRoleRepository(context);
  });

  afterEach(async () => {
    // Cleanup in FK order: children first, then parents
    await db.delete(tenantRoles);
    await db.execute(sql`DELETE FROM tenants`);
  });

  // Helper function to create parent fixtures
  async function createParentFixtures(tenantId?: string) {
    const tid = tenantId || crypto.randomUUID();
    const now = new Date();
    const tenantName = `Test Tenant ${crypto.randomUUID()}`;

    // Use raw SQL to insert tenant
    await db.execute(sql`INSERT INTO tenants (id, name, status, created_at, updated_at) VALUES (${tid}, ${tenantName}, 'ACTIVE', ${now.toISOString()}, ${now.toISOString()})`);

    return { tenantId: tid };
  }

  describe('01 insert', () => {
    it('should insert a new tenant role', async () => {
      const { tenantId } = await createParentFixtures();
      const tenantRoleId = new TenantRoleId();
      const now = new Date();
      const tenantRole = TenantRole.reconstruct({
        id: tenantRoleId.value,
        tenantId: tenantId,
        key: 'admin',
        status: 'ACTIVE',
        displayName: 'Admin',
        description: 'Administrator role',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(tenantRole);

        const found = await repository.findById(tenantRoleId);
        expect(found).not.toBeNull();
        expect(found?.id.value).toBe(tenantRoleId.value);
        expect(found?.tenantId.value).toBe(tenantId);
        expect(found?.key.value).toBe('admin');
        expect(found?.status).toBe('ACTIVE');
      });
    });

    it('should throw UniqueConstraintViolation for duplicate tenant+key', async () => {
      const { tenantId } = await createParentFixtures();
      const tenantRoleId1 = new TenantRoleId();
      const tenantRoleId2 = new TenantRoleId();
      const now = new Date();

      const tenantRole1 = TenantRole.reconstruct({
        id: tenantRoleId1.value,
        tenantId: tenantId,
        key: 'admin',
        status: 'ACTIVE',
        displayName: 'Admin',
        description: 'Administrator role',
        createdAt: now,
        updatedAt: now,
      });

      const tenantRole2 = TenantRole.reconstruct({
        id: tenantRoleId2.value,
        tenantId: tenantId,
        key: 'admin',
        status: 'ACTIVE',
        displayName: 'Admin 2',
        description: 'Administrator role 2',
        createdAt: now,
        updatedAt: now,
      });

      // First transaction: insert first role
      await uow.execute(async () => {
        await repository.insert(tenantRole1);
      });

      // Second transaction: try to insert second role with same tenant+key
      const uow2 = new DrizzleUnitOfWork(db);
      const context2 = uow2.getContext();
      const repository2 = new DrizzleTenantRoleRepository(context2);
      await expect(
        uow2.execute(async () => {
          await repository2.insert(tenantRole2);
        })
      ).rejects.toThrow(UniqueConstraintViolation);
    });
  });

  describe('02 findById', () => {
    it('should find tenant role by ID', async () => {
      const { tenantId } = await createParentFixtures();
      const tenantRoleId = new TenantRoleId();
      const now = new Date();
      const tenantRole = TenantRole.reconstruct({
        id: tenantRoleId.value,
        tenantId: tenantId,
        key: 'member',
        status: 'ACTIVE',
        displayName: 'Member',
        description: 'Member role',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(tenantRole);

        const found = await repository.findById(tenantRoleId);
        expect(found).not.toBeNull();
        expect(found?.id.value).toBe(tenantRoleId.value);
      });
    });

    it('should return null for non-existent ID', async () => {
      await createParentFixtures(); // Create tenant for FK consistency
      const tenantRoleId = new TenantRoleId();

      await uow.execute(async () => {
        const found = await repository.findById(tenantRoleId);
        expect(found).toBeNull();
      });
    });
  });

  describe('03 findByTenantAndKey', () => {
    it('should find tenant role by tenant and key', async () => {
      const { tenantId } = await createParentFixtures();
      const tenantRoleId = new TenantRoleId();
      const now = new Date();
      const tenantRole = TenantRole.reconstruct({
        id: tenantRoleId.value,
        tenantId: tenantId,
        key: 'viewer',
        status: 'ACTIVE',
        displayName: 'Viewer',
        description: 'Viewer role',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(tenantRole);

        const found = await repository.findByTenantAndKey(new TenantId(tenantId), 'viewer');
        expect(found).not.toBeNull();
        expect(found?.key.value).toBe('viewer');
      });
    });

    it('should return null for non-existent tenant+key combination', async () => {
      const { tenantId } = await createParentFixtures();

      await uow.execute(async () => {
        const found = await repository.findByTenantAndKey(new TenantId(tenantId), 'nonexistent');
        expect(found).toBeNull();
      });
    });
  });

  describe('04 findByTenantId', () => {
    it('should find all roles for a tenant', async () => {
      const { tenantId } = await createParentFixtures();
      const now = new Date();

      const tenantRole1 = TenantRole.reconstruct({
        id: new TenantRoleId().value,
        tenantId: tenantId,
        key: 'admin',
        status: 'ACTIVE',
        displayName: 'Admin',
        description: 'Admin role',
        createdAt: now,
        updatedAt: now,
      });

      const tenantRole2 = TenantRole.reconstruct({
        id: new TenantRoleId().value,
        tenantId: tenantId,
        key: 'member',
        status: 'ACTIVE',
        displayName: 'Member',
        description: 'Member role',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(tenantRole1);
        await repository.insert(tenantRole2);

        const found = await repository.findByTenantId(new TenantId(tenantId));
        expect(found).toHaveLength(2);
        expect(found[0].tenantId.value).toBe(tenantId);
        expect(found[1].tenantId.value).toBe(tenantId);
      });
    });

    it('should return empty array for tenant with no roles', async () => {
      const { tenantId } = await createParentFixtures();

      await uow.execute(async () => {
        const found = await repository.findByTenantId(new TenantId(tenantId));
        expect(found).toHaveLength(0);
      });
    });
  });

  describe('05 update', () => {
    it('should update an existing tenant role', async () => {
      const { tenantId } = await createParentFixtures();
      const tenantRoleId = new TenantRoleId();
      const now = new Date();
      const tenantRole = TenantRole.reconstruct({
        id: tenantRoleId.value,
        tenantId: tenantId,
        key: 'editor',
        status: 'ACTIVE',
        displayName: 'Editor',
        description: 'Editor role',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(tenantRole);

        const clock = { now: () => new Date() };
        const result = tenantRole.updateDisplay(
          'Updated Editor',
          'Updated description',
          clock
        );
        expect(result.isOk()).toBe(true);
        await repository.update(tenantRole);

        const found = await repository.findById(tenantRoleId);
        expect(found?.displayName).toBe('Updated Editor');
        expect(found?.description).toBe('Updated description');
      });
    });

    it('should throw PersistenceNotFoundError when updating non-existent tenant role', async () => {
      const { tenantId } = await createParentFixtures();
      const tenantRoleId = new TenantRoleId();
      const now = new Date();
      const tenantRole = TenantRole.reconstruct({
        id: tenantRoleId.value,
        tenantId: tenantId,
        key: 'nonexistent',
        status: 'ACTIVE',
        displayName: 'Nonexistent',
        description: 'Test',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await expect(repository.update(tenantRole)).rejects.toThrow(PersistenceNotFoundError);
      });
    });
  });
});
