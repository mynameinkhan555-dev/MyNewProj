import { describe, it, expect } from 'vitest';
import { User, UserStatus } from '@workspace/identity';
import {
  type Clock,
  TestClock,
  UuidGenerator,
  FakeIdGenerator,
  type IdGenerator,
  UuidEventIdGenerator,
  FakeEventIdGenerator,
  type EventIdGenerator,
} from '@workspace/kernel';

describe('User Aggregate', () => {
  describe('create', () => {
    it('should create a user with ACTIVE status', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const result = User.create(clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const user = result.value;
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should use injected IdGenerator for User ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new FakeIdGenerator(['user-123', 'user-456']);
      const eventIdGenerator = new UuidEventIdGenerator();
      const result = User.create(clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const user = result.value;
      expect(user.id.value).toBe('user-123');
    });

    it('should use injected EventIdGenerator for event ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new FakeEventIdGenerator(['event-456']);
      const result = User.create(clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const user = result.value;
      const events = user.domainEvents;
      expect(events[0].eventId).toBe('event-456');
    });

    it('should use injected Clock for timestamps', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const result = User.create(clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const user = result.value;
      expect(user.createdAt.getTime()).toBe(clock.now().getTime());
      expect(user.updatedAt.getTime()).toBe(clock.now().getTime());
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct user from persisted state', () => {
      const props = {
        id: 'user-123',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const user = User.reconstruct(props);

      expect(user.id.value).toBe('user-123');
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should NOT emit UserCreated event on reconstruct', () => {
      const props = {
        id: 'user-123',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const user = User.reconstruct(props);

      expect(user.domainEvents).toHaveLength(0);
    });

    it('should preserve supplied ID', () => {
      const props = {
        id: 'custom-user-id',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const user = User.reconstruct(props);

      expect(user.id.value).toBe('custom-user-id');
    });
  });

  describe('activate', () => {
    it('should activate suspended user', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.SUSPENDED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = user.activate(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });
  });

  describe('suspend', () => {
    it('should suspend active user', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = user.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(user.status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe('delete', () => {
    it('should delete active user', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = user.delete(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(user.status).toBe(UserStatus.DELETED);
    });

    it('should return error if already deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.DELETED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = user.delete(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('USER_ALREADY_DELETED');
      }
    });
  });

  describe('invalid transitions', () => {
    it('activate on ACTIVE returns USER_ALREADY_ACTIVE', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = user.activate(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('USER_ALREADY_ACTIVE');
      }
    });

    it('activate on DELETED returns USER_DELETED', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.DELETED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = user.activate(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('USER_DELETED');
      }
    });

    it('suspend on SUSPENDED returns USER_ALREADY_SUSPENDED', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.SUSPENDED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = user.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('USER_ALREADY_SUSPENDED');
      }
    });

    it('suspend on DELETED returns USER_DELETED', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.DELETED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = user.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('USER_DELETED');
      }
    });

    it('DELETED is terminal state', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const user = User.reconstruct({
        id: 'user-123',
        status: UserStatus.DELETED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      // All operations on DELETED user should fail
      const activateResult = user.activate(clock, eventIdGenerator);
      const suspendResult = user.suspend('Test reason', clock, eventIdGenerator);
      const deleteResult = user.delete(clock, eventIdGenerator);

      expect(activateResult.isErr()).toBe(true);
      expect(suspendResult.isErr()).toBe(true);
      expect(deleteResult.isErr()).toBe(true);
    });
  });
});
