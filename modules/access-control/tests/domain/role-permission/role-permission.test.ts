import { describe, it, expect } from 'vitest';
import { createRolePermission, type RolePermission } from '../../../src/domain/role-permission/RolePermission.js';
import { TenantRoleId } from '../../../src/domain/role/TenantRoleId.js';
import { PermissionId } from '../../../src/domain/permission/PermissionId.js';

describe('RolePermission', () => {
  describe('createRolePermission', () => {
    it('should create a valid role permission relationship', () => {
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      expect(relationship.roleId).toBe(roleId);
      expect(relationship.permissionId).toBe(permissionId);
      expect(relationship.createdAt).toEqual(createdAt);
    });

    it('should be a simple data structure without behavior', () => {
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      // It's just data, no methods
      expect(typeof relationship).toBe('object');
      expect(relationship.roleId).toBeInstanceOf(TenantRoleId);
      expect(relationship.permissionId).toBeInstanceOf(PermissionId);
    });

    it('should not have id field (composite PK in DB)', () => {
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      expect(relationship).not.toHaveProperty('id');
    });

    it('should not have status field', () => {
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      expect(relationship).not.toHaveProperty('status');
    });

    it('should not have updatedAt field', () => {
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      expect(relationship).not.toHaveProperty('updatedAt');
    });

    it('should have createdAt for audit', () => {
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01T10:30:00.000Z');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      expect(relationship.createdAt).toEqual(createdAt);
    });
  });

  describe('relationship semantics', () => {
    it('should represent role-has-permission relationship', () => {
      const roleId = new TenantRoleId('role-admin');
      const permissionId = new PermissionId('perm-member-read');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      // Semantics: Role "admin" has permission "member.read"
      expect(relationship.roleId.value).toBe('role-admin');
      expect(relationship.permissionId.value).toBe('perm-member-read');
    });

    it('should be immutable by design (no mutation methods)', () => {
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      // No methods to modify relationship
      expect(typeof relationship.grant).toBe('undefined');
      expect(typeof relationship.revoke).toBe('undefined');
      expect(typeof relationship.update).toBe('undefined');
    });

    it('should be deleted by Application layer, not Domain', () => {
      // RolePermission is just data structure
      // Grant/revoke are Application Use Case operations
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      // Domain layer doesn't have lifecycle control
      expect(relationship).not.toHaveProperty('delete');
      expect(relationship).not.toHaveProperty('deactivate');
    });
  });

  describe('aggregate boundary', () => {
    it('should not be part of TenantRole aggregate', () => {
      // RolePermission is separate relationship model
      // TenantRole does NOT own permissions[]
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      // It's independent data, not owned by Role
      expect(relationship.roleId).toBeInstanceOf(TenantRoleId);
      expect(relationship.permissionId).toBeInstanceOf(PermissionId);
    });

    it('should not be part of Permission aggregate', () => {
      const roleId = new TenantRoleId('role-123');
      const permissionId = new PermissionId('perm-456');
      const createdAt = new Date('2024-01-01');

      const relationship = createRolePermission(roleId, permissionId, createdAt);

      // Permission does NOT own roles[]
      expect(relationship.permissionId).toBeInstanceOf(PermissionId);
    });
  });

  describe('composite key semantics', () => {
    it('should allow same permission for different roles', () => {
      const roleId1 = new TenantRoleId('role-admin');
      const roleId2 = new TenantRoleId('role-manager');
      const permissionId = new PermissionId('perm-member-read');
      const createdAt = new Date('2024-01-01');

      const relationship1 = createRolePermission(roleId1, permissionId, createdAt);
      const relationship2 = createRolePermission(roleId2, permissionId, createdAt);

      // Different roles can have same permission
      expect(relationship1.permissionId.value).toBe(relationship2.permissionId.value);
      expect(relationship1.roleId.value).not.toBe(relationship2.roleId.value);
    });

    it('should allow same role to have different permissions', () => {
      const roleId = new TenantRoleId('role-admin');
      const permissionId1 = new PermissionId('perm-member-read');
      const permissionId2 = new PermissionId('perm-member-create');
      const createdAt = new Date('2024-01-01');

      const relationship1 = createRolePermission(roleId, permissionId1, createdAt);
      const relationship2 = createRolePermission(roleId, permissionId2, createdAt);

      // Same role can have multiple permissions
      expect(relationship1.roleId.value).toBe(relationship2.roleId.value);
      expect(relationship1.permissionId.value).not.toBe(relationship2.permissionId.value);
    });
  });
});
