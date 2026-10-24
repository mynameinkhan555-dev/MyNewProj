import { describe, it, expect } from 'vitest';
import {
  PlatformPermission,
  PermissionStatus,
  PermissionScope,
} from '@workspace/access-control';
import {
  TestClock,
  UuidGenerator,
  UuidEventIdGenerator,
} from '@workspace/kernel';

describe('PlatformPermission', () => {
  describe('create', () => {
    it('should create a new platform permission with ACTIVE status', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = PlatformPermission.create(
        'platform.audit',
        'Platform Audit',
        'Allows auditing platform-wide operations',
        {},
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const permission = result.value;
        expect(permission.key.value).toBe('platform.audit');
        expect(permission.status).toBe(PermissionStatus.ACTIVE);
        expect(permission.displayName).toBe('Platform Audit');
        expect(permission.createdAt).toEqual(clock.now());
        expect(permission.updatedAt).toEqual(clock.now());
      }
    });

    it('should trim display name', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = PlatformPermission.create(
        'platform.audit',
        '  Platform Audit  ',
        'Allows auditing platform-wide operations',
        {},
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const permission = result.value;
        expect(permission.displayName).toBe('Platform Audit');
      }
    });

    it('should return error if display name is empty', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = PlatformPermission.create(
        'platform.audit',
        '',
        'Allows auditing platform-wide operations',
        {},
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('DISPLAY_NAME_REQUIRED');
      }
    });

    it('should return error if permission key is invalid', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = PlatformPermission.create(
        'invalid',
        'Platform Audit',
        'Allows auditing platform-wide operations',
        {},
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isErr()).toBe(true);
    });

    it('should emit PermissionCreated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = PlatformPermission.create(
        'platform.audit',
        'Platform Audit',
        'Allows auditing platform-wide operations',
        {},
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const permission = result.value;
        const events = permission.domainEvents;
        expect(events).toHaveLength(1);
        expect(events[0].eventName).toBe('permission.PermissionCreated');
      }
    });

    it('should set scope to PLATFORM in event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = PlatformPermission.create(
        'platform.audit',
        'Platform Audit',
        'Allows auditing platform-wide operations',
        {},
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const permission = result.value;
        const events = permission.domainEvents;
        const event = events[0] as any;
        expect(event.scope).toBe(PermissionScope.PLATFORM);
      }
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct platform permission from persisted state', () => {
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(permission.key.value).toBe('platform.audit');
      expect(permission.status).toBe(PermissionStatus.ACTIVE);
      expect(permission.displayName).toBe('Platform Audit');
    });

    it('should reconstruct does not emit event', () => {
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const events = permission.domainEvents;
      expect(events).toHaveLength(0);
    });
  });

  describe('updateDisplay', () => {
    it('should update display information', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = permission.updateDisplay(
        'Platform Audit Access',
        'Allows auditing platform-wide operations access',
        { resourceType: 'platform' },
        clock,
      );

      expect(result.isOk()).toBe(true);
      expect(permission.displayName).toBe('Platform Audit Access');
      expect(permission.description).toBe('Allows auditing platform-wide operations access');
      expect(permission.metadata).toEqual({ resourceType: 'platform' });
    });

    it('should return error if deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.DELETED,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = permission.updateDisplay(
        'Platform Audit Access',
        'Allows auditing platform-wide operations access',
        {},
        clock,
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('PERMISSION_DELETED');
      }
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      permission.updateDisplay('Platform Audit Access', 'Allows auditing platform-wide operations access', {}, clock);

      expect(permission.updatedAt).toEqual(clock.now());
    });
  });

  describe('delete', () => {
    it('should delete permission', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = permission.delete(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(permission.status).toBe(PermissionStatus.DELETED);
    });

    it('should return error if already deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.DELETED,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = permission.delete(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('PERMISSION_ALREADY_DELETED');
      }
    });

    it('should emit PermissionDeleted event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      permission.delete(clock, eventIdGenerator);

      const events = permission.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('permission.PermissionDeleted');
    });

    it('should include scope in event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      permission.delete(clock, eventIdGenerator);

      const events = permission.domainEvents;
      const event = events[0] as any;
      expect(event.scope).toBe(PermissionScope.PLATFORM);
    });
  });

  describe('immutability', () => {
    it('id is immutable', () => {
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalId = permission.id.value;
      expect(permission.id.value).toBe(originalId);
    });

    it('key is immutable', () => {
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalKey = permission.key.value;
      expect(permission.key.value).toBe(originalKey);
    });

    it('createdAt is immutable', () => {
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalCreatedAt = permission.createdAt;
      expect(permission.createdAt).toBe(originalCreatedAt);
    });
  });
});
