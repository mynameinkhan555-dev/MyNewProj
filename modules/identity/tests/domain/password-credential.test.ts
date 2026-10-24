import { describe, it, expect } from 'vitest';
import { PasswordCredential, UserId } from '@workspace/identity';
import {
  type Clock,
  TestClock,
  UuidGenerator,
  FakeIdGenerator,
  UuidEventIdGenerator,
  FakeEventIdGenerator,
  type EventIdGenerator,
} from '@workspace/kernel';

describe('PasswordCredential Aggregate', () => {
  describe('create', () => {
    it('should create password credential with hashed password', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const hashedPassword = '$2b$10$hashedPasswordString123';

      const result = PasswordCredential.create(userId, hashedPassword, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const credential = result.value;
      expect(credential.userId.value).toBe('user-123');
      expect(credential.hashedPassword).toBe('$2b$10$hashedPasswordString123');
    });

    it('should emit PasswordCredentialCreated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const hashedPassword = '$2b$10$hashedPasswordString123';

      const result = PasswordCredential.create(userId, hashedPassword, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const credential = result.value;
      const events = credential.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.PasswordCredentialCreated');
      expect(events[0].aggregateType).toBe('PasswordCredential');
    });

    it('should use injected IdGenerator for ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new FakeIdGenerator(['pwd-123', 'event-456']);
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const hashedPassword = '$2b$10$hashedPasswordString123';

      const result = PasswordCredential.create(userId, hashedPassword, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const credential = result.value;
      expect(credential.id.value).toBe('pwd-123');
    });

    it('should use injected EventIdGenerator for event ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new FakeEventIdGenerator(['event-456']);
      const userId = new UserId('user-123');
      const hashedPassword = '$2b$10$hashedPasswordString123';

      const result = PasswordCredential.create(userId, hashedPassword, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const credential = result.value;
      const events = credential.domainEvents;
      expect(events[0].eventId).toBe('event-456');
    });

    it('should use injected Clock for timestamps', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const hashedPassword = '$2b$10$hashedPasswordString123';

      const result = PasswordCredential.create(userId, hashedPassword, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const credential = result.value;
      expect(credential.createdAt.getTime()).toBe(clock.now().getTime());
      expect(credential.updatedAt.getTime()).toBe(clock.now().getTime());
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct from persisted state', () => {
      const props = {
        id: 'pwd-123',
        userId: 'user-123',
        hashedPassword: '$2b$10$hashedPasswordString123',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const credential = PasswordCredential.reconstruct(props);

      expect(credential.id.value).toBe('pwd-123');
      expect(credential.userId.value).toBe('user-123');
      expect(credential.hashedPassword).toBe('$2b$10$hashedPasswordString123');
    });

    it('should NOT emit event on reconstruct', () => {
      const props = {
        id: 'pwd-123',
        userId: 'user-123',
        hashedPassword: '$2b$10$hashedPasswordString123',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const credential = PasswordCredential.reconstruct(props);

      expect(credential.domainEvents).toHaveLength(0);
    });
  });

  describe('changePassword', () => {
    it('should change hashed password', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const credential = PasswordCredential.reconstruct({
        id: 'pwd-123',
        userId: 'user-123',
        hashedPassword: '$2b$10$oldHashedPassword',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const newHashedPassword = '$2b$10$newHashedPassword';
      const result = credential.changePassword(newHashedPassword, clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(credential.hashedPassword).toBe('$2b$10$newHashedPassword');
    });

    it('should emit PasswordCredentialChanged event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const credential = PasswordCredential.reconstruct({
        id: 'pwd-123',
        userId: 'user-123',
        hashedPassword: '$2b$10$oldHashedPassword',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const newHashedPassword = '$2b$10$newHashedPassword';
      credential.changePassword(newHashedPassword, clock, eventIdGenerator);

      const events = credential.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.PasswordCredentialChanged');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const credential = PasswordCredential.reconstruct({
        id: 'pwd-123',
        userId: 'user-123',
        hashedPassword: '$2b$10$oldHashedPassword',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const newHashedPassword = '$2b$10$newHashedPassword';
      credential.changePassword(newHashedPassword, clock, eventIdGenerator);

      expect(credential.updatedAt.getTime()).toBe(clock.now().getTime());
    });
  });

  describe('immutability', () => {
    it('id is immutable', () => {
      const credential = PasswordCredential.reconstruct({
        id: 'pwd-123',
        userId: 'user-123',
        hashedPassword: '$2b$10$hashedPasswordString123',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      const originalId = credential.id.value;
      // No method to change id - immutable by design
      expect(credential.id.value).toBe(originalId);
    });

    it('userId is immutable', () => {
      const credential = PasswordCredential.reconstruct({
        id: 'pwd-123',
        userId: 'user-123',
        hashedPassword: '$2b$10$hashedPasswordString123',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      const originalUserId = credential.userId.value;
      // No method to change userId - immutable by design
      expect(credential.userId.value).toBe(originalUserId);
    });
  });
});
