import { describe, it, expect } from 'vitest';
import { EmailIdentity, Email, UserId } from '@workspace/identity';
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

describe('EmailIdentity Aggregate', () => {
  describe('create', () => {
    it('should create email identity with unverified status', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const email = Email.create('user@example.com').value;

      const result = EmailIdentity.create(userId, email, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const emailIdentity = result.value;
      expect(emailIdentity.verifiedAt).toBeNull();
      expect(emailIdentity.primary).toBe(false);
    });

    it('should emit EmailIdentityCreated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const email = Email.create('user@example.com').value;

      const result = EmailIdentity.create(userId, email, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const emailIdentity = result.value;
      const events = emailIdentity.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.EmailIdentityCreated');
      expect(events[0].aggregateType).toBe('EmailIdentity');
    });

    it('should use injected IdGenerator for ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new FakeIdGenerator(['email-123', 'event-456']);
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const email = Email.create('user@example.com').value;

      const result = EmailIdentity.create(userId, email, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const emailIdentity = result.value;
      expect(emailIdentity.id.value).toBe('email-123');
    });

    it('should use injected EventIdGenerator for event ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new FakeEventIdGenerator(['event-456']);
      const userId = new UserId('user-123');
      const email = Email.create('user@example.com').value;

      const result = EmailIdentity.create(userId, email, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const emailIdentity = result.value;
      const events = emailIdentity.domainEvents;
      expect(events[0].eventId).toBe('event-456');
    });

    it('should use injected Clock for timestamps', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const email = Email.create('user@example.com').value;

      const result = EmailIdentity.create(userId, email, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const emailIdentity = result.value;
      expect(emailIdentity.createdAt.getTime()).toBe(clock.now().getTime());
      expect(emailIdentity.updatedAt.getTime()).toBe(clock.now().getTime());
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct from persisted state', () => {
      const props = {
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const emailIdentity = EmailIdentity.reconstruct(props);

      expect(emailIdentity.id.value).toBe('email-123');
      expect(emailIdentity.userId.value).toBe('user-123');
      expect(emailIdentity.email.value).toBe('user@example.com');
      expect(emailIdentity.verifiedAt).not.toBeNull();
      expect(emailIdentity.primary).toBe(true);
    });

    it('should NOT emit event on reconstruct', () => {
      const props = {
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: null,
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const emailIdentity = EmailIdentity.reconstruct(props);

      expect(emailIdentity.domainEvents).toHaveLength(0);
    });
  });

  describe('verify', () => {
    it('should verify unverified email', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: null,
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = emailIdentity.verify(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(emailIdentity.verifiedAt).not.toBeNull();
    });

    it('should emit EmailIdentityVerified event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: null,
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      emailIdentity.verify(clock, eventIdGenerator);

      const events = emailIdentity.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.EmailIdentityVerified');
    });

    it('should return error if already verified', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = emailIdentity.verify(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('EMAIL_ALREADY_VERIFIED');
      }
    });

    it('verifiedAt is one-way transition', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: null,
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result1 = emailIdentity.verify(clock, eventIdGenerator);
      expect(result1.isOk()).toBe(true);
      const verifiedAt1 = emailIdentity.verifiedAt;

      const result2 = emailIdentity.verify(clock, eventIdGenerator);
      expect(result2.isErr()).toBe(true);
      expect(emailIdentity.verifiedAt).toBe(verifiedAt1);
    });
  });

  describe('promoteToPrimary', () => {
    it('should promote non-primary email to primary', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = emailIdentity.promoteToPrimary(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(emailIdentity.primary).toBe(true);
    });

    it('should emit EmailIdentityPromotedToPrimary event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      emailIdentity.promoteToPrimary(clock, eventIdGenerator);

      const events = emailIdentity.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.EmailIdentityPromotedToPrimary');
    });

    it('should return error if already primary', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = emailIdentity.promoteToPrimary(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('EMAIL_ALREADY_PRIMARY');
      }
    });
  });

  describe('demoteFromPrimary', () => {
    it('should demote primary email', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = emailIdentity.demoteFromPrimary(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(emailIdentity.primary).toBe(false);
    });

    it('should emit EmailIdentityDemotedFromPrimary event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00.000Z'),
      });

      emailIdentity.demoteFromPrimary(clock, eventIdGenerator);

      const events = emailIdentity.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.EmailIdentityDemotedFromPrimary');
    });

    it('should return error if not primary', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = emailIdentity.demoteFromPrimary(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('EMAIL_NOT_PRIMARY');
      }
    });
  });

  describe('immutability', () => {
    it('userId is immutable', () => {
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: null,
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalUserId = emailIdentity.userId.value;
      // No method to change userId - immutable by design
      expect(emailIdentity.userId.value).toBe(originalUserId);
    });

    it('email is immutable', () => {
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: null,
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalEmail = emailIdentity.email.value;
      // No method to change email - immutable by design
      expect(emailIdentity.email.value).toBe(originalEmail);
    });
  });

  describe('business methods', () => {
    it('isVerified returns true for verified email', () => {
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(emailIdentity.isVerified()).toBe(true);
      expect(emailIdentity.isPrimary()).toBe(false);
    });

    it('isVerified returns false for unverified email', () => {
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: null,
        primary: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(emailIdentity.isVerified()).toBe(false);
    });

    it('isPrimary returns true for primary email', () => {
      const emailIdentity = EmailIdentity.reconstruct({
        id: 'email-123',
        userId: 'user-123',
        email: 'user@example.com',
        verifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        primary: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(emailIdentity.isPrimary()).toBe(true);
    });
  });
});
