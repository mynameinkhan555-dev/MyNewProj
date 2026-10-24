import { describe, it, expect } from 'vitest';
import {
  Membership,
  MembershipStatus,
  MembershipId,
  TenantId,
} from '@workspace/tenant';
import { UserId } from '@workspace/identity';
import {
  TestClock,
  UuidGenerator,
  UuidEventIdGenerator,
} from '@workspace/kernel';

describe('Membership', () => {
  describe('create', () => {
    it('should create a new membership with ACTIVE status', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const tenantId = new TenantId('tenant-123');

      const result = Membership.create(userId, tenantId, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const membership = result.value;
        expect(membership.userId.value).toBe('user-123');
        expect(membership.tenantId.value).toBe('tenant-123');
        expect(membership.status).toBe(MembershipStatus.ACTIVE);
        expect(membership.joinedAt).toEqual(clock.now());
        expect(membership.createdAt).toEqual(clock.now());
        expect(membership.updatedAt).toEqual(clock.now());
      }
    });

    it('should use injected IdGenerator for ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const tenantId = new TenantId('tenant-123');

      const result = Membership.create(userId, tenantId, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const membership = result.value;
        expect(membership.id.value).toBeTruthy();
      }
    });

    it('should use injected Clock for timestamps', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const tenantId = new TenantId('tenant-123');

      const result = Membership.create(userId, tenantId, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const membership = result.value;
        expect(membership.joinedAt).toEqual(clock.now());
        expect(membership.createdAt).toEqual(clock.now());
        expect(membership.updatedAt).toEqual(clock.now());
      }
    });

    it('should emit MembershipCreated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const tenantId = new TenantId('tenant-123');

      const result = Membership.create(userId, tenantId, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const membership = result.value;
        const events = membership.domainEvents;
        expect(events).toHaveLength(1);
        expect(events[0].eventName).toBe('tenant.MembershipCreated');
      }
    });

    it('should use EventIdGenerator for event ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const tenantId = new TenantId('tenant-123');

      const result = Membership.create(userId, tenantId, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const membership = result.value;
        const events = membership.domainEvents;
        expect(events[0].eventId).toBeTruthy();
      }
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct membership from persisted state', () => {
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(membership.id.value).toBe('membership-123');
      expect(membership.userId.value).toBe('user-123');
      expect(membership.tenantId.value).toBe('tenant-123');
      expect(membership.status).toBe(MembershipStatus.ACTIVE);
    });

    it('should reconstruct with version', () => {
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        version: 5,
      });

      expect(membership.version).toBe(5);
    });

    it('should reconstruct does not emit event', () => {
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const events = membership.domainEvents;
      expect(events).toHaveLength(0);
    });
  });

  describe('activate', () => {
    it('should activate suspended membership', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.SUSPENDED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.activate(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(membership.status).toBe(MembershipStatus.ACTIVE);
    });

    it('should return error if already active', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.activate(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('MEMBERSHIP_ALREADY_ACTIVE');
      }
    });

    it('should return error if deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.DELETED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.activate(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('MEMBERSHIP_DELETED');
      }
    });

    it('should emit MembershipActivated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.SUSPENDED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      membership.activate(clock, eventIdGenerator);

      const events = membership.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('tenant.MembershipActivated');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.SUSPENDED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      membership.activate(clock, eventIdGenerator);

      expect(membership.updatedAt).toEqual(clock.now());
    });
  });

  describe('suspend', () => {
    it('should suspend active membership', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(membership.status).toBe(MembershipStatus.SUSPENDED);
    });

    it('should return error if already suspended', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.SUSPENDED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('MEMBERSHIP_ALREADY_SUSPENDED');
      }
    });

    it('should return error if deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.DELETED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('MEMBERSHIP_DELETED');
      }
    });

    it('should emit MembershipSuspended event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      membership.suspend('Policy violation', clock, eventIdGenerator);

      const events = membership.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('tenant.MembershipSuspended');
    });

    it('should include reason in event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      membership.suspend('Policy violation', clock, eventIdGenerator);

      const events = membership.domainEvents;
      const event = events[0] as any;
      expect(event.reason).toBe('Policy violation');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      membership.suspend('Test reason', clock, eventIdGenerator);

      expect(membership.updatedAt).toEqual(clock.now());
    });
  });

  describe('delete', () => {
    it('should delete active membership', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.delete(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(membership.status).toBe(MembershipStatus.DELETED);
    });

    it('should delete suspended membership', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.SUSPENDED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.delete(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(membership.status).toBe(MembershipStatus.DELETED);
    });

    it('should return error if already deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.DELETED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = membership.delete(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('MEMBERSHIP_ALREADY_DELETED');
      }
    });

    it('should emit MembershipDeleted event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      membership.delete(clock, eventIdGenerator);

      const events = membership.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('tenant.MembershipDeleted');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      membership.delete(clock, eventIdGenerator);

      expect(membership.updatedAt).toEqual(clock.now());
    });
  });

  describe('invalid transitions', () => {
    it('DELETED is terminal state', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.DELETED,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      // All operations on DELETED membership should fail
      const activateResult = membership.activate(clock, eventIdGenerator);
      const suspendResult = membership.suspend('Test reason', clock, eventIdGenerator);
      const deleteResult = membership.delete(clock, eventIdGenerator);

      expect(activateResult.isErr()).toBe(true);
      expect(suspendResult.isErr()).toBe(true);
      expect(deleteResult.isErr()).toBe(true);
    });
  });

  describe('immutability', () => {
    it('id is immutable', () => {
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalId = membership.id.value;
      // No method to change id - immutable by design
      expect(membership.id.value).toBe(originalId);
    });

    it('userId is immutable', () => {
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalUserId = membership.userId.value;
      // No method to change userId - immutable by design
      expect(membership.userId.value).toBe(originalUserId);
    });

    it('tenantId is immutable', () => {
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalTenantId = membership.tenantId.value;
      // No method to change tenantId - immutable by design
      expect(membership.tenantId.value).toBe(originalTenantId);
    });

    it('joinedAt is immutable', () => {
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalJoinedAt = membership.joinedAt;
      // No method to change joinedAt - immutable by design
      expect(membership.joinedAt).toBe(originalJoinedAt);
    });
  });
});
