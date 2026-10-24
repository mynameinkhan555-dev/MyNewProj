import { describe, it, expect } from 'vitest';
import { TenantRole } from '../../../src/domain/role/TenantRole.js';
import { TenantId } from '@workspace/tenant';
import { TestClock, UuidGenerator, UuidEventIdGenerator } from '@workspace/kernel';

describe('Role Events Security', () => {
  const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
  const idGenerator = new UuidGenerator();
  const eventIdGenerator = new UuidEventIdGenerator();
  const tenantId = new TenantId(idGenerator.generate());

  describe('RoleCreatedEvent', () => {
    it('should have safe payload structure', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Full admin access',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const role = result.value;

      const events = role.domainEvents;
      expect(events.length).toBe(1);

      const event = events[0];
      expect(event.eventId).toBeDefined();
      expect(event.eventName).toBe('role.RoleCreated');
      expect(event.occurredAt).toEqual(clock.now());
      expect(event.aggregateId).toBe(role.id.value);
      expect(event.aggregateType).toBe('TenantRole');
      expect(event.tenantId).toBe(tenantId.value);
      expect(event.roleKey).toBe('admin');
    });

    it('should not include displayName in event', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const role = result.value;

      const event = role.domainEvents[0];
      expect(event).not.toHaveProperty('displayName');
    });

    it('should not include description in event', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const role = result.value;

      const event = role.domainEvents[0];
      expect(event).not.toHaveProperty('description');
    });

    it('should not include internal object references', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const role = result.value;

      const event = role.domainEvents[0];
      expect(event).not.toHaveProperty('role');
      expect(event).not.toHaveProperty('tenant');
    });
  });

  describe('RoleDeletedEvent', () => {
    it('should have safe payload structure', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();
      clock.advanceBy(1000);

      role.delete(clock, eventIdGenerator);

      const events = role.domainEvents;
      expect(events.length).toBe(1);

      const event = events[0];
      expect(event.eventId).toBeDefined();
      expect(event.eventName).toBe('role.RoleDeleted');
      expect(event.occurredAt).toEqual(clock.now());
      expect(event.aggregateId).toBe(role.id.value);
      expect(event.aggregateType).toBe('TenantRole');
      expect(event.tenantId).toBe(tenantId.value);
      expect(event.roleKey).toBe('admin');
    });

    it('should not include displayName in event', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();
      role.delete(clock, eventIdGenerator);

      const event = role.domainEvents[0];
      expect(event).not.toHaveProperty('displayName');
    });

    it('should not include description in event', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();
      role.delete(clock, eventIdGenerator);

      const event = role.domainEvents[0];
      expect(event).not.toHaveProperty('description');
    });
  });

  describe('Event ID vs Aggregate ID', () => {
    it('should generate distinct event ID from aggregate ID', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = role.domainEvents[0];
      expect(event.eventId).not.toBe(role.id.value);
    });
  });

  describe('Event immutability', () => {
    it('should not expose mutable references in event payload', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = role.domainEvents[0];
      expect(typeof event.roleKey).toBe('string');
      expect(typeof event.tenantId).toBe('string');
      expect(typeof event.aggregateId).toBe('string');
    });
  });

  describe('Reconstruction emits no events', () => {
    it('should not emit events when reconstructing from persistence', () => {
      const props = {
        id: idGenerator.generate(),
        tenantId: tenantId.value,
        key: 'admin',
        status: 'ACTIVE' as const,
        displayName: 'Administrator',
        description: 'Description',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const role = TenantRole.reconstruct(props);
      const events = role.domainEvents;

      expect(events.length).toBe(0);
    });
  });

  describe('Tenant scope preservation', () => {
    it('should preserve tenantId in event', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = role.domainEvents[0];
      expect(event.tenantId).toBe(tenantId.value);
      expect(event.aggregateType).toBe('TenantRole');
    });
  });

  describe('Event timestamp from Clock', () => {
    it('should use Clock for event timestamp', () => {
      const fixedTime = new Date('2024-06-15T10:30:00.000Z');
      const roleClock = new TestClock(fixedTime);

      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        roleClock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = role.domainEvents[0];
      expect(event.occurredAt).toEqual(fixedTime);
    });
  });

  describe('Event ID generator separation', () => {
    it('should use EventIdGenerator for event ID', () => {
      const customEventIdGenerator = new UuidEventIdGenerator();

      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        customEventIdGenerator,
      ).value;

      const event = role.domainEvents[0];
      expect(event.eventId).toBeDefined();
      expect(event.eventId).not.toBe(role.id.value);
    });
  });

  describe('Safe primitive payloads', () => {
    it('should contain only primitive string values in payload', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = role.domainEvents[0];
      expect(typeof event.eventId).toBe('string');
      expect(typeof event.eventName).toBe('string');
      expect(typeof event.aggregateId).toBe('string');
      expect(typeof event.aggregateType).toBe('string');
      expect(typeof event.tenantId).toBe('string');
      expect(typeof event.roleKey).toBe('string');
    });
  });

  describe('Future Outbox compatibility', () => {
    it('should have JSON-serializable payload', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = role.domainEvents[0];

      // Should not throw when stringified
      expect(() => JSON.stringify(event)).not.toThrow();

      const serialized = JSON.stringify(event);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.eventId).toBe(event.eventId);
      expect(deserialized.eventName).toBe(event.eventName);
      expect(deserialized.tenantId).toBe(event.tenantId);
      expect(deserialized.roleKey).toBe(event.roleKey);
    });
  });
});
