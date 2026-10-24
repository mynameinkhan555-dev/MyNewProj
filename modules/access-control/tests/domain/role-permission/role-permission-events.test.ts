import { describe, it, expect } from 'vitest';
import type {
  RolePermissionGrantedEvent,
  RolePermissionRevokedEvent,
} from '../../../src/domain/role-permission/events/RolePermissionEvents.js';

describe('RolePermission Security Events (Application/Outbox Level)', () => {
  describe('RolePermissionGrantedEvent', () => {
    it('should have complete audit payload', () => {
      const event: RolePermissionGrantedEvent = {
        eventId: 'event-123',
        eventName: 'rolePermission.RolePermissionGranted',
        occurredAt: new Date('2024-01-01T10:00:00.000Z'),
        actorUserId: 'user-123',
        actorMembershipId: 'membership-456',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        grantTimestamp: new Date('2024-01-01T10:00:00.000Z'),
      };

      expect(event.eventId).toBe('event-123');
      expect(event.eventName).toBe('rolePermission.RolePermissionGranted');
      expect(event.actorUserId).toBe('user-123');
      expect(event.actorMembershipId).toBe('membership-456');
      expect(event.roleId).toBe('role-789');
      expect(event.roleKey).toBe('admin');
      expect(event.tenantId).toBe('tenant-101');
      expect(event.permissionId).toBe('perm-202');
      expect(event.permissionKey).toBe('member.read');
      expect(event.permissionScope).toBe('TENANT');
      expect(event.grantTimestamp).toEqual(new Date('2024-01-01T10:00:00.000Z'));
    });

    it('should include actor information for audit', () => {
      const event: RolePermissionGrantedEvent = {
        eventId: 'event-123',
        eventName: 'rolePermission.RolePermissionGranted',
        occurredAt: new Date('2024-01-01'),
        actorUserId: 'user-123',
        actorMembershipId: 'membership-456',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        grantTimestamp: new Date('2024-01-01'),
      };

      expect(event.actorUserId).toBeDefined();
      expect(event.actorMembershipId).toBeDefined();
    });

    it('should include role information for cache invalidation', () => {
      const event: RolePermissionGrantedEvent = {
        eventId: 'event-123',
        eventName: 'rolePermission.RolePermissionGranted',
        occurredAt: new Date('2024-01-01'),
        actorUserId: 'user-123',
        actorMembershipId: 'membership-456',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        grantTimestamp: new Date('2024-01-01'),
      };

      expect(event.roleId).toBeDefined();
      expect(event.roleKey).toBeDefined();
      expect(event.tenantId).toBeDefined();
    });

    it('should include permission information for security monitoring', () => {
      const event: RolePermissionGrantedEvent = {
        eventId: 'event-123',
        eventName: 'rolePermission.RolePermissionGranted',
        occurredAt: new Date('2024-01-01'),
        actorUserId: 'user-123',
        actorMembershipId: 'membership-456',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        grantTimestamp: new Date('2024-01-01'),
      };

      expect(event.permissionId).toBeDefined();
      expect(event.permissionKey).toBeDefined();
      expect(event.permissionScope).toBeDefined();
    });

    it('should not include internal object references', () => {
      const event: RolePermissionGrantedEvent = {
        eventId: 'event-123',
        eventName: 'rolePermission.RolePermissionGranted',
        occurredAt: new Date('2024-01-01'),
        actorUserId: 'user-123',
        actorMembershipId: 'membership-456',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        grantTimestamp: new Date('2024-01-01'),
      };

      expect(event).not.toHaveProperty('role');
      expect(event).not.toHaveProperty('permission');
      expect(event).not.toHaveProperty('membership');
      expect(event).not.toHaveProperty('user');
    });

    it('should be JSON-serializable for Outbox', () => {
      const event: RolePermissionGrantedEvent = {
        eventId: 'event-123',
        eventName: 'rolePermission.RolePermissionGranted',
        occurredAt: new Date('2024-01-01'),
        actorUserId: 'user-123',
        actorMembershipId: 'membership-456',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        grantTimestamp: new Date('2024-01-01'),
      };

      expect(() => JSON.stringify(event)).not.toThrow();

      const serialized = JSON.stringify(event);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.eventId).toBe(event.eventId);
      expect(deserialized.actorUserId).toBe(event.actorUserId);
      expect(deserialized.roleKey).toBe(event.roleKey);
      expect(deserialized.permissionKey).toBe(event.permissionKey);
    });
  });

  describe('RolePermissionRevokedEvent', () => {
    it('should have complete audit payload', () => {
      const event: RolePermissionRevokedEvent = {
        eventId: 'event-456',
        eventName: 'rolePermission.RolePermissionRevoked',
        occurredAt: new Date('2024-01-02T11:00:00.000Z'),
        actorUserId: 'user-789',
        actorMembershipId: 'membership-321',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        revokeTimestamp: new Date('2024-01-02T11:00:00.000Z'),
      };

      expect(event.eventId).toBe('event-456');
      expect(event.eventName).toBe('rolePermission.RolePermissionRevoked');
      expect(event.actorUserId).toBe('user-789');
      expect(event.actorMembershipId).toBe('membership-321');
      expect(event.roleId).toBe('role-789');
      expect(event.roleKey).toBe('admin');
      expect(event.tenantId).toBe('tenant-101');
      expect(event.permissionId).toBe('perm-202');
      expect(event.permissionKey).toBe('member.read');
      expect(event.permissionScope).toBe('TENANT');
      expect(event.revokeTimestamp).toEqual(new Date('2024-01-02T11:00:00.000Z'));
    });

    it('should include actor information for audit', () => {
      const event: RolePermissionRevokedEvent = {
        eventId: 'event-456',
        eventName: 'rolePermission.RolePermissionRevoked',
        occurredAt: new Date('2024-01-02'),
        actorUserId: 'user-789',
        actorMembershipId: 'membership-321',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        revokeTimestamp: new Date('2024-01-02'),
      };

      expect(event.actorUserId).toBeDefined();
      expect(event.actorMembershipId).toBeDefined();
    });

    it('should include role and permission information for cache invalidation', () => {
      const event: RolePermissionRevokedEvent = {
        eventId: 'event-456',
        eventName: 'rolePermission.RolePermissionRevoked',
        occurredAt: new Date('2024-01-02'),
        actorUserId: 'user-789',
        actorMembershipId: 'membership-321',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        revokeTimestamp: new Date('2024-01-02'),
      };

      expect(event.roleId).toBeDefined();
      expect(event.roleKey).toBeDefined();
      expect(event.tenantId).toBeDefined();
      expect(event.permissionId).toBeDefined();
      expect(event.permissionKey).toBeDefined();
    });

    it('should not include internal object references', () => {
      const event: RolePermissionRevokedEvent = {
        eventId: 'event-456',
        eventName: 'rolePermission.RolePermissionRevoked',
        occurredAt: new Date('2024-01-02'),
        actorUserId: 'user-789',
        actorMembershipId: 'membership-321',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        revokeTimestamp: new Date('2024-01-02'),
      };

      expect(event).not.toHaveProperty('role');
      expect(event).not.toHaveProperty('permission');
      expect(event).not.toHaveProperty('membership');
      expect(event).not.toHaveProperty('user');
    });

    it('should be JSON-serializable for Outbox', () => {
      const event: RolePermissionRevokedEvent = {
        eventId: 'event-456',
        eventName: 'rolePermission.RolePermissionRevoked',
        occurredAt: new Date('2024-01-02'),
        actorUserId: 'user-789',
        actorMembershipId: 'membership-321',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        revokeTimestamp: new Date('2024-01-02'),
      };

      expect(() => JSON.stringify(event)).not.toThrow();

      const serialized = JSON.stringify(event);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.eventId).toBe(event.eventId);
      expect(deserialized.actorUserId).toBe(event.actorUserId);
      expect(deserialized.roleKey).toBe(event.roleKey);
      expect(deserialized.permissionKey).toBe(event.permissionKey);
    });
  });

  describe('Event Security Audit', () => {
    it('should include all necessary fields for security audit', () => {
      const grantedEvent: RolePermissionGrantedEvent = {
        eventId: 'event-123',
        eventName: 'rolePermission.RolePermissionGranted',
        occurredAt: new Date('2024-01-01'),
        actorUserId: 'user-123',
        actorMembershipId: 'membership-456',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        grantTimestamp: new Date('2024-01-01'),
      };

      const revokedEvent: RolePermissionRevokedEvent = {
        eventId: 'event-456',
        eventName: 'rolePermission.RolePermissionRevoked',
        occurredAt: new Date('2024-01-02'),
        actorUserId: 'user-789',
        actorMembershipId: 'membership-321',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        revokeTimestamp: new Date('2024-01-02'),
      };

      // Audit: WHO
      expect(grantedEvent.actorUserId).toBeDefined();
      expect(revokedEvent.actorUserId).toBeDefined();

      // Audit: WHAT
      expect(grantedEvent.roleKey).toBeDefined();
      expect(grantedEvent.permissionKey).toBeDefined();
      expect(revokedEvent.roleKey).toBeDefined();
      expect(revokedEvent.permissionKey).toBeDefined();

      // Audit: WHERE
      expect(grantedEvent.tenantId).toBeDefined();
      expect(revokedEvent.tenantId).toBeDefined();

      // Audit: WHEN
      expect(grantedEvent.grantTimestamp).toBeDefined();
      expect(revokedEvent.revokeTimestamp).toBeDefined();
    });

    it('should not include sensitive data', () => {
      const event: RolePermissionGrantedEvent = {
        eventId: 'event-123',
        eventName: 'rolePermission.RolePermissionGranted',
        occurredAt: new Date('2024-01-01'),
        actorUserId: 'user-123',
        actorMembershipId: 'membership-456',
        roleId: 'role-789',
        roleKey: 'admin',
        tenantId: 'tenant-101',
        permissionId: 'perm-202',
        permissionKey: 'member.read',
        permissionScope: 'TENANT',
        grantTimestamp: new Date('2024-01-01'),
      };

      // No secrets
      expect(event).not.toHaveProperty('secret');
      expect(event).not.toHaveProperty('apiKey');
      expect(event).not.toHaveProperty('token');
      expect(event).not.toHaveProperty('password');
    });
  });
});
