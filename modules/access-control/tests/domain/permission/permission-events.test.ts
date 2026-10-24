import { describe, it, expect } from 'vitest';
import {
  TenantPermission,
  PlatformPermission,
  PermissionStatus,
} from '@workspace/access-control';
import {
  TestClock,
  UuidGenerator,
  UuidEventIdGenerator,
} from '@workspace/kernel';

describe('Permission Event Security', () => {
  describe('TenantPermission events', () => {
    it('PermissionCreatedEvent should not expose sensitive data', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = TenantPermission.create(
        'member.read',
        'Read Members',
        'Allows reading tenant members',
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

        // Event should only contain semantic data
        expect(event.permissionKey).toBe('member.read');
        expect(event.scope).toBe('TENANT');
        // No sensitive data
        expect(event.displayName).toBeUndefined();
        expect(event.description).toBeUndefined();
        expect(event.metadata).toBeUndefined();
        expect(event.password).toBeUndefined();
        expect(event.apiKey).toBeUndefined();
        expect(event.secret).toBeUndefined();
      }
    });

    it('PermissionDeletedEvent should not expose sensitive data', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const permission = TenantPermission.reconstruct({
        id: 'permission-123',
        key: 'member.read',
        status: PermissionStatus.ACTIVE,
        displayName: 'Read Members',
        description: 'Allows reading tenant members',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      permission.delete(clock, eventIdGenerator);

      const events = permission.domainEvents;
      const event = events[0] as any;

      // Event should only contain semantic data
      expect(event.permissionKey).toBe('member.read');
      expect(event.scope).toBe('TENANT');
      // No sensitive data
      expect(event.displayName).toBeUndefined();
      expect(event.description).toBeUndefined();
      expect(event.metadata).toBeUndefined();
      expect(event.password).toBeUndefined();
      expect(event.apiKey).toBeUndefined();
      expect(event.secret).toBeUndefined();
    });
  });

  describe('PlatformPermission events', () => {
    it('PermissionCreatedEvent should not expose sensitive data', () => {
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

        // Event should only contain semantic data
        expect(event.permissionKey).toBe('platform.audit');
        expect(event.scope).toBe('PLATFORM');
        // No sensitive data
        expect(event.displayName).toBeUndefined();
        expect(event.description).toBeUndefined();
        expect(event.metadata).toBeUndefined();
        expect(event.password).toBeUndefined();
        expect(event.apiKey).toBeUndefined();
        expect(event.secret).toBeUndefined();
      }
    });

    it('PermissionDeletedEvent should not expose sensitive data', () => {
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

      // Event should only contain semantic data
      expect(event.permissionKey).toBe('platform.audit');
      expect(event.scope).toBe('PLATFORM');
      // No sensitive data
      expect(event.displayName).toBeUndefined();
      expect(event.description).toBeUndefined();
      expect(event.metadata).toBeUndefined();
      expect(event.password).toBeUndefined();
      expect(event.apiKey).toBeUndefined();
      expect(event.secret).toBeUndefined();
    });
  });

  describe('reconstruct emits no event', () => {
    it('TenantPermission reconstruct should not emit event', () => {
      const permission = TenantPermission.reconstruct({
        id: 'permission-123',
        key: 'member.read',
        status: PermissionStatus.ACTIVE,
        displayName: 'Read Members',
        description: 'Allows reading tenant members',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const events = permission.domainEvents;
      expect(events).toHaveLength(0);
    });

    it('PlatformPermission reconstruct should not emit event', () => {
      const permission = PlatformPermission.reconstruct({
        id: 'permission-123',
        key: 'platform.audit',
        status: PermissionStatus.ACTIVE,
        displayName: 'Platform Audit',
        description: 'Allows auditing platform-wide operations',
        metadata: {},
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      );

      const events = permission.domainEvents;
      expect(events).toHaveLength(0);
    });
  });

  describe('Event ID ≠ Aggregate ID', () => {
    it('TenantPermission uses separate EventIdGenerator', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = TenantPermission.create(
        'member.read',
        'Read Members',
        'Allows reading tenant members',
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

        expect(event.eventId).toBeTruthy();
        expect(event.aggregateId).toBe(permission.id.value);
        expect(event.eventId).not.toBe(permission.id.value);
      }
    });

    it('PlatformPermission uses separate EventIdGenerator', () => {
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

        expect(event.eventId).toBeTruthy();
        expect(event.aggregateId).toBe(permission.id.value);
        expect(event.eventId).not.toBe(permission.id.value);
      }
    });
  });
});
