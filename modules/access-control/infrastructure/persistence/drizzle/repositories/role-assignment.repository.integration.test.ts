/**
 * RoleAssignmentRepository Integration Tests
 *
 * Integration tests with real PostgreSQL to qualify RoleAssignmentRepository.
 *
 * Test coverage:
 * 01 insert - valid RoleAssignment, duplicate active assignment constraint
 * 02 findById - existing, missing
 * 03 findByMembershipId - existing, empty
 * 04 findByMembershipAndRole - existing, missing
 * 05 findActiveByMembershipId - existing, empty
 * 06 update - existing, missing
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DrizzleUnitOfWork } from '@workspace/platform-database/unitOfWork';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { createDatabaseClient } from '@workspace/platform-database/drizzle-client';
import { DrizzleRoleAssignmentRepository } from './role-assignment.repository.js';
import { RoleAssignment } from '../../../../src/domain/assignment/RoleAssignment.js';
import { RoleAssignmentId } from '../../../../src/domain/assignment/RoleAssignmentId.js';
import { MembershipId } from '@workspace/tenant';
import { TenantRoleId } from '../../../../src/domain/role/TenantRoleId.js';
import { UniqueConstraintViolation, PersistenceNotFoundError } from '@workspace/platform-database/persistence';
import { sql } from '@workspace/platform-database/drizzle-pg-core';
import * as accessControlSchema from '../schema/index.js';
import { roleAssignments, tenantRoles } from '../schema/index.js';
import { memberships, tenants } from '@workspace/tenant/infrastructure/persistence/drizzle/schema';
import { users } from '@workspace/identity/infrastructure/persistence/drizzle/schema';

describe('DrizzleRoleAssignmentRepository — PostgreSQL Integration', () => {
  let db: any;
  let uow: DrizzleUnitOfWork;
  let repository: DrizzleRoleAssignmentRepository;

  beforeAll(() => {
    db = createDatabaseClient(accessControlSchema);
  });

  beforeEach(() => {
    uow = new DrizzleUnitOfWork(db);
    const context = uow.getContext();
    repository = new DrizzleRoleAssignmentRepository(context);
  });

  afterEach(async () => {
    // Cleanup in FK order: children first, then parents using raw SQL
    await db.delete(roleAssignments);
    await db.delete(tenantRoles);
    await db.execute(sql`DELETE FROM memberships`);
    await db.execute(sql`DELETE FROM tenants`);
    await db.execute(sql`DELETE FROM users`);
  });

  // Helper function to create parent fixtures using raw SQL
  async function createParentFixtures(membershipId?: string, roleId?: string) {
    const userId = crypto.randomUUID();
    const tenantId = crypto.randomUUID();
    const mid = membershipId || crypto.randomUUID();
    const rid = roleId || crypto.randomUUID();
    const now = new Date();
    const tenantName = `Test Tenant ${crypto.randomUUID()}`;

    // Use raw SQL to insert into all tables
    await db.execute(sql`INSERT INTO users (id, status, created_at, updated_at) VALUES (${userId}, 'ACTIVE', ${now.toISOString()}, ${now.toISOString()})`);

    await db.execute(sql`INSERT INTO tenants (id, name, status, created_at, updated_at) VALUES (${tenantId}, ${tenantName}, 'ACTIVE', ${now.toISOString()}, ${now.toISOString()})`);

    await db.execute(sql`INSERT INTO memberships (id, user_id, tenant_id, status, joined_at, created_at, updated_at) VALUES (${mid}, ${userId}, ${tenantId}, 'ACTIVE', ${now.toISOString()}, ${now.toISOString()}, ${now.toISOString()})`);

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

    return { membershipId: mid, roleId: rid, tenantId };
  }

  describe('01 insert', () => {
    it('should insert a new role assignment', async () => {
      const { membershipId, roleId } = await createParentFixtures();
      const roleAssignmentId = new RoleAssignmentId();
      const now = new Date();
      const roleAssignment = RoleAssignment.reconstruct({
        id: roleAssignmentId.value,
        membershipId: membershipId,
        roleId: roleId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(roleAssignment);

        const found = await repository.findById(roleAssignmentId);
        expect(found).not.toBeNull();
        expect(found?.id.value).toBe(roleAssignmentId.value);
        expect(found?.membershipId.value).toBe(membershipId);
        expect(found?.roleId.value).toBe(roleId);
        expect(found?.status).toBe('ACTIVE');
      });
    });

    it('should throw UniqueConstraintViolation for duplicate active assignment', async () => {
      const { membershipId, roleId } = await createParentFixtures();
      const roleAssignmentId1 = new RoleAssignmentId();
      const roleAssignmentId2 = new RoleAssignmentId();
      const now = new Date();

      const roleAssignment1 = RoleAssignment.reconstruct({
        id: roleAssignmentId1.value,
        membershipId: membershipId,
        roleId: roleId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      const roleAssignment2 = RoleAssignment.reconstruct({
        id: roleAssignmentId2.value,
        membershipId: membershipId,
        roleId: roleId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      // First transaction: insert first assignment
      await uow.execute(async () => {
        await repository.insert(roleAssignment1);
      });

      // Second transaction: try to insert second ACTIVE assignment for same membership+role
      const uow2 = new DrizzleUnitOfWork(db);
      const context2 = uow2.getContext();
      const repository2 = new DrizzleRoleAssignmentRepository(context2);
      await expect(
        uow2.execute(async () => {
          await repository2.insert(roleAssignment2);
        })
      ).rejects.toThrow(UniqueConstraintViolation);
    });
  });

  describe('02 findById', () => {
    it('should find role assignment by ID', async () => {
      const { membershipId, roleId } = await createParentFixtures();
      const roleAssignmentId = new RoleAssignmentId();
      const now = new Date();
      const roleAssignment = RoleAssignment.reconstruct({
        id: roleAssignmentId.value,
        membershipId: membershipId,
        roleId: roleId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(roleAssignment);

        const found = await repository.findById(roleAssignmentId);
        expect(found).not.toBeNull();
        expect(found?.id.value).toBe(roleAssignmentId.value);
      });
    });

    it('should return null for non-existent ID', async () => {
      const roleAssignmentId = new RoleAssignmentId();

      await uow.execute(async () => {
        const found = await repository.findById(roleAssignmentId);
        expect(found).toBeNull();
      });
    });
  });

  describe('03 findByMembershipId', () => {
    it('should find all role assignments for a membership', async () => {
      const membershipId = crypto.randomUUID();
      const roleId1 = crypto.randomUUID();
      const roleId2 = crypto.randomUUID();
      const now = new Date();

      // Create parent fixtures
      const { tenantId } = await createParentFixtures(membershipId, roleId1);
      await db.insert(tenantRoles).values({
        id: roleId2,
        tenantId: tenantId,
        key: 'test-role-2',
        name: 'Test Role 2',
        displayName: 'Test Role 2 Display',
        description: 'Test Role 2 Description',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      const roleAssignment1 = RoleAssignment.reconstruct({
        id: new RoleAssignmentId().value,
        membershipId: membershipId,
        roleId: roleId1,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      const roleAssignment2 = RoleAssignment.reconstruct({
        id: new RoleAssignmentId().value,
        membershipId: membershipId,
        roleId: roleId2,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(roleAssignment1);
        await repository.insert(roleAssignment2);

        const found = await repository.findByMembershipId(new MembershipId(membershipId));
        expect(found).toHaveLength(2);
        expect(found[0].membershipId.value).toBe(membershipId);
        expect(found[1].membershipId.value).toBe(membershipId);
      });
    });

    it('should return empty array for membership with no assignments', async () => {
      const membershipId = new MembershipId();

      await uow.execute(async () => {
        const found = await repository.findByMembershipId(membershipId);
        expect(found).toHaveLength(0);
      });
    });
  });

  describe('04 findByMembershipAndRole', () => {
    it('should find role assignment by membership and role', async () => {
      const { membershipId, roleId } = await createParentFixtures();
      const roleAssignmentId = new RoleAssignmentId();
      const now = new Date();
      const roleAssignment = RoleAssignment.reconstruct({
        id: roleAssignmentId.value,
        membershipId: membershipId,
        roleId: roleId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(roleAssignment);

        const found = await repository.findByMembershipAndRole(new MembershipId(membershipId), new TenantRoleId(roleId));
        expect(found).not.toBeNull();
        expect(found?.id.value).toBe(roleAssignmentId.value);
      });
    });

    it('should return null for non-existent membership+role combination', async () => {
      const membershipId = new MembershipId();
      const roleId = new TenantRoleId();

      await uow.execute(async () => {
        const found = await repository.findByMembershipAndRole(membershipId, roleId);
        expect(found).toBeNull();
      });
    });
  });

  describe('05 findActiveByMembershipId', () => {
    it('should find active role assignments for a membership', async () => {
      const membershipId = crypto.randomUUID();
      const roleId1 = crypto.randomUUID();
      const roleId2 = crypto.randomUUID();
      const now = new Date();

      // Create parent fixtures
      const { tenantId } = await createParentFixtures(membershipId, roleId1);
      await db.insert(tenantRoles).values({
        id: roleId2,
        tenantId: tenantId,
        key: 'test-role-2',
        name: 'Test Role 2',
        displayName: 'Test Role 2 Display',
        description: 'Test Role 2 Description',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      const roleAssignment1 = RoleAssignment.reconstruct({
        id: new RoleAssignmentId().value,
        membershipId: membershipId,
        roleId: roleId1,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      const roleAssignment2 = RoleAssignment.reconstruct({
        id: new RoleAssignmentId().value,
        membershipId: membershipId,
        roleId: roleId2,
        status: 'DELETED',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(roleAssignment1);
        await repository.insert(roleAssignment2);

        const found = await repository.findActiveByMembershipId(new MembershipId(membershipId));
        expect(found).toHaveLength(1);
        expect(found[0].status).toBe('ACTIVE');
      });
    });

    it('should return empty array for membership with no active assignments', async () => {
      const membershipId = new MembershipId();

      await uow.execute(async () => {
        const found = await repository.findActiveByMembershipId(membershipId);
        expect(found).toHaveLength(0);
      });
    });
  });

  describe('06 update', () => {
    it('should update an existing role assignment', async () => {
      const { membershipId, roleId } = await createParentFixtures();
      const roleAssignmentId = new RoleAssignmentId();
      const now = new Date();
      const roleAssignment = RoleAssignment.reconstruct({
        id: roleAssignmentId.value,
        membershipId: membershipId,
        roleId: roleId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await repository.insert(roleAssignment);

        const clock = { now: () => new Date() };
        const result = roleAssignment.delete(clock, { generate: () => 'event-id' });
        expect(result.isOk()).toBe(true);
        await repository.update(roleAssignment);

        const found = await repository.findById(roleAssignmentId);
        expect(found?.status).toBe('DELETED');
      });
    });

    it('should throw PersistenceNotFoundError when updating non-existent role assignment', async () => {
      const { membershipId, roleId } = await createParentFixtures();
      const roleAssignmentId = new RoleAssignmentId();
      const now = new Date();
      const roleAssignment = RoleAssignment.reconstruct({
        id: roleAssignmentId.value,
        membershipId: membershipId,
        roleId: roleId,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      });

      await uow.execute(async () => {
        await expect(repository.update(roleAssignment)).rejects.toThrow(PersistenceNotFoundError);
      });
    });
  });
});
