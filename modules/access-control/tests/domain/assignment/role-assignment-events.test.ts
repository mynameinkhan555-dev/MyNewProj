import { describe, it, expect } from 'vitest';
import { RoleAssignment } from '../../../src/domain/assignment/RoleAssignment.js';
import { MembershipId } from '@workspace/tenant';
import { TenantRoleId } from '../../../src/domain/role/TenantRoleId.js';
import { TestClock, UuidGenerator, UuidEventIdGenerator } from '@workspace/kernel';

describe('RoleAssignment Events Security', () => {
  const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
  const idGenerator = new UuidGenerator();
  const eventIdGenerator = new UuidEventIdGenerator();
  const membershipId = new MembershipId(idGenerator.generate());
  const roleId = new TenantRoleId(idGenerator.generate());

  describe('RoleAssignmentCreatedEvent', () => {
    it('should have safe payload structure', () => {
      const result = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const assignment = result.value;

      const events = assignment.domainEvents;
      expect(events.length).toBe(1);

      const event = events[0];
      expect(event.eventId).toBeDefined();
      expect(event.eventName).toBe('roleAssignment.RoleAssignmentCreated');
      expect(event.occurredAt).toEqual(clock.now());
      expect(event.aggregateId).toBe(assignment.id.value);
      expect(event.aggregateType).toBe('RoleAssignment');
      expect(event.membershipId).toBe(membershipId.value);
      expect(event.roleId).toBe(roleId.value);
    });

    it('should not include userId in event', () => {
      const result = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const assignment = result.value;

      const event = assignment.domainEvents[0];
      expect(event).not.toHaveProperty('userId');
    });

    it('should not include tenantId in event', () => {
      const result = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const assignment = result.value;

      const event = assignment.domainEvents[0];
      expect(event).not.toHaveProperty('tenantId');
    });

    it('should not include internal object references', () => {
      const result = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const assignment = result.value;

      const event = assignment.domainEvents[0];
      expect(event).not.toHaveProperty('membership');
      expect(event).not.toHaveProperty('role');
      expect(event).not.toHaveProperty('user');
    });
  });

  describe('RoleAssignmentDeletedEvent', () => {
    it('should have safe payload structure', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      assignment.pullDomainEvents();
      clock.advanceBy(1000);

      assignment.delete(clock, eventIdGenerator);

      const events = assignment.domainEvents;
      expect(events.length).toBe(1);

      const event = events[0];
      expect(event.eventId).toBeDefined();
      expect(event.eventName).toBe('roleAssignment.RoleAssignmentDeleted');
      expect(event.occurredAt).toEqual(clock.now());
      expect(event.aggregateId).toBe(assignment.id.value);
      expect(event.aggregateType).toBe('RoleAssignment');
      expect(event.membershipId).toBe(membershipId.value);
      expect(event.roleId).toBe(roleId.value);
    });

    it('should not include userId in event', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      assignment.pullDomainEvents();
      assignment.delete(clock, eventIdGenerator);

      const event = assignment.domainEvents[0];
      expect(event).not.toHaveProperty('userId');
    });

    it('should not include tenantId in event', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      assignment.pullDomainEvents();
      assignment.delete(clock, eventIdGenerator);

      const event = assignment.domainEvents[0];
      expect(event).not.toHaveProperty('tenantId');
    });

    it('should not include internal object references', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      assignment.pullDomainEvents();
      assignment.delete(clock, eventIdGenerator);

      const event = assignment.domainEvents[0];
      expect(event).not.toHaveProperty('membership');
      expect(event).not.toHaveProperty('role');
    });
  });

  describe('Event ID vs Aggregate ID', () => {
    it('should generate distinct event ID from aggregate ID', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = assignment.domainEvents[0];
      expect(event.eventId).not.toBe(assignment.id.value);
    });
  });

  describe('Event immutability', () => {
    it('should not expose mutable references in event payload', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = assignment.domainEvents[0];
      expect(typeof event.membershipId).toBe('string');
      expect(typeof event.roleId).toBe('string');
      expect(typeof event.aggregateId).toBe('string');
    });
  });

  describe('Reconstruction emits no events', () => {
    it('should not emit events when reconstructing from persistence', () => {
      const props = {
        id: idGenerator.generate(),
        membershipId: membershipId.value,
        roleId: roleId.value,
        status: 'ACTIVE' as const,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const assignment = RoleAssignment.reconstruct(props);
      const events = assignment.domainEvents;

      expect(events.length).toBe(0);
    });
  });

  describe('Event timestamp from Clock', () => {
    it('should use Clock for event timestamp', () => {
      const fixedTime = new Date('2024-06-15T10:30:00.000Z');
      const assignmentClock = new TestClock(fixedTime);

      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        assignmentClock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = assignment.domainEvents[0];
      expect(event.occurredAt).toEqual(fixedTime);
    });
  });

  describe('Safe primitive payloads', () => {
    it('should contain only primitive string values in payload', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = assignment.domainEvents[0];
      expect(typeof event.eventId).toBe('string');
      expect(typeof event.eventName).toBe('string');
      expect(typeof event.aggregateId).toBe('string');
      expect(typeof event.aggregateType).toBe('string');
      expect(typeof event.membershipId).toBe('string');
      expect(typeof event.roleId).toBe('string');
    });
  });

  describe('Future Outbox compatibility', () => {
    it('should have JSON-serializable payload', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const event = assignment.domainEvents[0];

      // Should not throw when stringified
      expect(() => JSON.stringify(event)).not.toThrow();

      const serialized = JSON.stringify(event);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.eventId).toBe(event.eventId);
      expect(deserialized.eventName).toBe(event.eventName);
      expect(deserialized.membershipId).toBe(event.membershipId);
      expect(deserialized.roleId).toBe(event.roleId);
    });
  });
});
