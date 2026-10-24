import { describe, it, expect } from 'vitest';
import { RoleAssignment } from '../../../src/domain/assignment/RoleAssignment.js';
import { MembershipId } from '@workspace/tenant';
import { TenantRoleId } from '../../../src/domain/role/TenantRoleId.js';
import { RoleAssignmentStatus } from '../../../src/domain/assignment/RoleAssignmentStatus.js';
import { TestClock, UuidGenerator, UuidEventIdGenerator } from '@workspace/kernel';

describe('RoleAssignment', () => {
  const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
  const idGenerator = new UuidGenerator();
  const eventIdGenerator = new UuidEventIdGenerator();
  const membershipId = new MembershipId(idGenerator.generate());
  const roleId = new TenantRoleId(idGenerator.generate());

  describe('create', () => {
    it('should create a valid role assignment', () => {
      const result = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const assignment = result.value;

      expect(assignment.id.value).toBeDefined();
      expect(assignment.membershipId.value).toBe(membershipId.value);
      expect(assignment.roleId.value).toBe(roleId.value);
      expect(assignment.status).toBe(RoleAssignmentStatus.ACTIVE);
      expect(assignment.createdAt).toEqual(clock.now());
      expect(assignment.updatedAt).toEqual(clock.now());
    });

    it('should emit RoleAssignmentCreated event', () => {
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
      expect(event.eventName).toBe('roleAssignment.RoleAssignmentCreated');
      expect(event.aggregateType).toBe('RoleAssignment');
      expect(event.membershipId).toBe(membershipId.value);
      expect(event.roleId).toBe(roleId.value);
      expect(event.aggregateId).toBe(assignment.id.value);
      expect(event.occurredAt).toEqual(clock.now());
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct role assignment from persisted state', () => {
      const props = {
        id: idGenerator.generate(),
        membershipId: membershipId.value,
        roleId: roleId.value,
        status: RoleAssignmentStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        version: 5,
      };

      const assignment = RoleAssignment.reconstruct(props);

      expect(assignment.id.value).toBe(props.id);
      expect(assignment.membershipId.value).toBe(props.membershipId);
      expect(assignment.roleId.value).toBe(props.roleId);
      expect(assignment.status).toBe(props.status);
      expect(assignment.createdAt).toEqual(props.createdAt);
      expect(assignment.updatedAt).toEqual(props.updatedAt);
      expect(assignment.version).toBe(5);
    });

    it('should reconstruct without emitting events', () => {
      const props = {
        id: idGenerator.generate(),
        membershipId: membershipId.value,
        roleId: roleId.value,
        status: RoleAssignmentStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const assignment = RoleAssignment.reconstruct(props);
      const events = assignment.domainEvents;

      expect(events.length).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete assignment and emit event', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      assignment.pullDomainEvents();
      clock.advanceBy(1000);

      const result = assignment.delete(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(assignment.status).toBe(RoleAssignmentStatus.DELETED);
      expect(assignment.updatedAt).toEqual(clock.now());

      const events = assignment.domainEvents;
      expect(events.length).toBe(1);

      const event = events[0];
      expect(event.eventName).toBe('roleAssignment.RoleAssignmentDeleted');
      expect(event.aggregateType).toBe('RoleAssignment');
      expect(event.membershipId).toBe(membershipId.value);
      expect(event.roleId).toBe(roleId.value);
      expect(event.aggregateId).toBe(assignment.id.value);
    });

    it('should reject delete if already deleted', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      assignment.pullDomainEvents();
      assignment.delete(clock, eventIdGenerator);

      const result = assignment.delete(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ASSIGNMENT_ALREADY_DELETED');
    });
  });

  describe('identity immutability', () => {
    it('should have immutable id', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const originalId = assignment.id.value;
      assignment.delete(clock, eventIdGenerator);

      expect(assignment.id.value).toBe(originalId);
    });

    it('should have immutable membershipId', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const originalMembershipId = assignment.membershipId.value;
      assignment.delete(clock, eventIdGenerator);

      expect(assignment.membershipId.value).toBe(originalMembershipId);
    });

    it('should have immutable roleId', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const originalRoleId = assignment.roleId.value;
      assignment.delete(clock, eventIdGenerator);

      expect(assignment.roleId.value).toBe(originalRoleId);
    });

    it('should have immutable createdAt', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const originalCreatedAt = assignment.createdAt;
      clock.advanceBy(1000);
      assignment.delete(clock, eventIdGenerator);

      expect(assignment.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('aggregate boundary', () => {
    it('should not store userId', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      expect(assignment).not.toHaveProperty('userId');
    });

    it('should not store tenantId', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      expect(assignment).not.toHaveProperty('tenantId');
    });

    it('should not store Membership object', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      expect(assignment).not.toHaveProperty('membership');
    });

    it('should not store Role object', () => {
      const assignment = RoleAssignment.create(
        membershipId,
        roleId,
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      expect(assignment).not.toHaveProperty('role');
    });
  });
});
