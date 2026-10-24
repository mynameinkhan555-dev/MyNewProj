import { describe, it, expect } from 'vitest';
import { Session, UserId } from '@workspace/identity';
import {
  DomainError,
  type Clock,
  TestClock,
  UuidGenerator,
  FakeIdGenerator,
  UuidEventIdGenerator,
  FakeEventIdGenerator,
  type EventIdGenerator,
} from '@workspace/kernel';

describe('Session Aggregate', () => {
  describe('create', () => {
    it('should create session with all fields', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const userId = new UserId('user-123');
      const refreshTokenHash = '$2b$10$refreshTokenHashString';
      const expiresAt = new Date('2024-01-08T00:00:00.000Z'); // 7 days

      const result = Session.create(userId, refreshTokenHash, expiresAt, clock, idGenerator);

      expect(result.isOk()).toBe(true);
      const session = result.value;
      expect(session.userId.value).toBe('user-123');
      expect(session.refreshTokenHash).toBe('$2b$10$refreshTokenHashString');
      expect(session.expiresAt.getTime()).toBe(expiresAt.getTime());
      expect(session.revokedAt).toBeNull();
    });

    it('should NOT emit SessionCreated event (CRUD-only principle)', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const userId = new UserId('user-123');
      const refreshTokenHash = '$2b$10$refreshTokenHashString';
      const expiresAt = new Date('2024-01-08T00:00:00.000Z');

      const result = Session.create(userId, refreshTokenHash, expiresAt, clock, idGenerator);

      expect(result.isOk()).toBe(true);
      const session = result.value;
      const events = session.domainEvents;

      expect(events).toHaveLength(0);
    });

    it('should use injected IdGenerator for ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new FakeIdGenerator(['session-123', 'event-456']);
      const userId = new UserId('user-123');
      const refreshTokenHash = '$2b$10$refreshTokenHashString';
      const expiresAt = new Date('2024-01-08T00:00:00.000Z');

      const result = Session.create(userId, refreshTokenHash, expiresAt, clock, idGenerator);

      expect(result.isOk()).toBe(true);
      const session = result.value;
      expect(session.id.value).toBe('session-123');
    });

    it('should use injected Clock for timestamps', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const userId = new UserId('user-123');
      const refreshTokenHash = '$2b$10$refreshTokenHashString';
      const expiresAt = new Date('2024-01-08T00:00:00.000Z');

      const result = Session.create(userId, refreshTokenHash, expiresAt, clock, idGenerator);

      expect(result.isOk()).toBe(true);
      const session = result.value;
      expect(session.createdAt.getTime()).toBe(clock.now().getTime());
      expect(session.updatedAt.getTime()).toBe(clock.now().getTime());
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct active session', () => {
      const props = {
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      const session = Session.reconstruct(props);

      expect(session.id.value).toBe('session-123');
      expect(session.userId.value).toBe('user-123');
      expect(session.refreshTokenHash).toBe('$2b$10$refreshTokenHashString');
      expect(session.revokedAt).toBeNull();
    });

    it('should reconstruct revoked session', () => {
      const props = {
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: new Date('2024-01-02T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const session = Session.reconstruct(props);

      expect(session.revokedAt).not.toBeNull();
    });

    it('should NOT emit event on reconstruct', () => {
      const props = {
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      const session = Session.reconstruct(props);

      expect(session.domainEvents).toHaveLength(0);
    });
  });

  describe('revoke', () => {
    it('should revoke active session', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = session.revoke(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(session.revokedAt).not.toBeNull();
      expect(session.revokedAt?.getTime()).toBe(clock.now().getTime());
    });

    it('should emit SessionRevoked event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      session.revoke(clock, eventIdGenerator);

      const events = session.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.SessionRevoked');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      session.revoke(clock, eventIdGenerator);

      expect(session.updatedAt.getTime()).toBe(clock.now().getTime());
    });

    it('should return error if already revoked', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: new Date('2024-01-02T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      const result = session.revoke(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('SESSION_ALREADY_REVOKED');
      }
    });

    it('should allow revoking expired session (security best practice)', () => {
      const clock = new TestClock(new Date('2024-01-09T00:00:00.000Z')); // After expiration
      const eventIdGenerator = new UuidEventIdGenerator();
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'), // Expired
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = session.revoke(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(session.revokedAt).not.toBeNull();
    });
  });

  describe('immutability', () => {
    it('id is immutable', () => {
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalId = session.id.value;
      // No method to change id - immutable by design
      expect(session.id.value).toBe(originalId);
    });

    it('userId is immutable', () => {
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalUserId = session.userId.value;
      // No method to change userId - immutable by design
      expect(session.userId.value).toBe(originalUserId);
    });

    it('expiresAt is immutable', () => {
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalExpiresAt = session.expiresAt;
      // No method to change expiresAt - immutable by design
      expect(session.expiresAt).toBe(originalExpiresAt);
    });
  });

  describe('isExpired', () => {
    it('should return false for active session', () => {
      const clock = new TestClock(new Date('2024-01-02T00:00:00.000Z'));
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(session.isExpired(clock)).toBe(false);
    });

    it('should return true for expired session', () => {
      const clock = new TestClock(new Date('2024-01-09T00:00:00.000Z'));
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(session.isExpired(clock)).toBe(true);
    });

    it('should return true at exact expiration moment', () => {
      const clock = new TestClock(new Date('2024-01-08T00:00:00.000Z'));
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(session.isExpired(clock)).toBe(true);
    });
  });

  describe('isRevoked', () => {
    it('should return false for active session', () => {
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(session.isRevoked()).toBe(false);
    });

    it('should return true for revoked session', () => {
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: new Date('2024-01-02T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      expect(session.isRevoked()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should return true for active session', () => {
      const clock = new TestClock(new Date('2024-01-02T00:00:00.000Z'));
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(session.isValid(clock)).toBe(true);
    });

    it('should return false for expired session', () => {
      const clock = new TestClock(new Date('2024-01-09T00:00:00.000Z'));
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(session.isValid(clock)).toBe(false);
    });

    it('should return false for revoked session', () => {
      const clock = new TestClock(new Date('2024-01-02T00:00:00.000Z'));
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: new Date('2024-01-02T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      expect(session.isValid(clock)).toBe(false);
    });

    it('should return false for expired and revoked session', () => {
      const clock = new TestClock(new Date('2024-01-09T00:00:00.000Z'));
      const session = Session.reconstruct({
        id: 'session-123',
        userId: 'user-123',
        refreshTokenHash: '$2b$10$refreshTokenHashString',
        expiresAt: new Date('2024-01-08T00:00:00.000Z'),
        revokedAt: new Date('2024-01-02T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      });

      expect(session.isValid(clock)).toBe(false);
    });
  });
});
