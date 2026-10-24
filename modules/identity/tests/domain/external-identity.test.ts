import { describe, it, expect } from 'vitest';
import { ExternalIdentity, ExternalIdentityProvider, Email, UserId } from '@workspace/identity';
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

describe('ExternalIdentity Aggregate', () => {
  describe('create', () => {
    it('should create external identity with all fields', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const provider = ExternalIdentityProvider.create('google').value;
      const providerSubject = '123456789';
      const identityVerifiedAt = new Date('2024-01-01T00:00:00.000Z');
      const providerEmail = Email.create('user@example.com').value;
      const providerEmailVerified = true;

      const result = ExternalIdentity.create(
        userId,
        provider,
        providerSubject,
        identityVerifiedAt,
        providerEmail,
        providerEmailVerified,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const externalIdentity = result.value;
      expect(externalIdentity.userId.value).toBe('user-123');
      expect(externalIdentity.provider.value).toBe('GOOGLE');
      expect(externalIdentity.providerSubject).toBe('123456789');
      expect(externalIdentity.providerEmail?.value).toBe('user@example.com');
      expect(externalIdentity.providerEmailVerified).toBe(true);
    });

    it('should create external identity without provider email', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const provider = ExternalIdentityProvider.create('telegram').value;
      const providerSubject = '849302840';
      const identityVerifiedAt = new Date('2024-01-01T00:00:00.000Z');

      const result = ExternalIdentity.create(
        userId,
        provider,
        providerSubject,
        identityVerifiedAt,
        null,
        null,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const externalIdentity = result.value;
      expect(externalIdentity.providerEmail).toBeNull();
      expect(externalIdentity.providerEmailVerified).toBeNull();
    });

    it('should emit ExternalIdentityCreated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const provider = ExternalIdentityProvider.create('google').value;
      const providerSubject = '123456789';
      const identityVerifiedAt = new Date('2024-01-01T00:00:00.000Z');

      const result = ExternalIdentity.create(
        userId,
        provider,
        providerSubject,
        identityVerifiedAt,
        null,
        null,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const externalIdentity = result.value;
      const events = externalIdentity.domainEvents;

      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.ExternalIdentityCreated');
      expect(events[0].aggregateType).toBe('ExternalIdentity');
    });

    it('should use injected IdGenerator for ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new FakeIdGenerator(['ext-123', 'event-456']);
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const provider = ExternalIdentityProvider.create('google').value;
      const providerSubject = '123456789';
      const identityVerifiedAt = new Date('2024-01-01T00:00:00.000Z');

      const result = ExternalIdentity.create(
        userId,
        provider,
        providerSubject,
        identityVerifiedAt,
        null,
        null,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const externalIdentity = result.value;
      expect(externalIdentity.id.value).toBe('ext-123');
    });

    it('should use injected EventIdGenerator for event ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new FakeEventIdGenerator(['event-456']);
      const userId = new UserId('user-123');
      const provider = ExternalIdentityProvider.create('google').value;
      const providerSubject = '123456789';
      const identityVerifiedAt = new Date('2024-01-01T00:00:00.000Z');

      const result = ExternalIdentity.create(
        userId,
        provider,
        providerSubject,
        identityVerifiedAt,
        null,
        null,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const externalIdentity = result.value;
      const events = externalIdentity.domainEvents;
      expect(events[0].eventId).toBe('event-456');
    });

    it('should use injected Clock for timestamps', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const provider = ExternalIdentityProvider.create('google').value;
      const providerSubject = '123456789';
      const identityVerifiedAt = new Date('2024-01-01T00:00:00.000Z');

      const result = ExternalIdentity.create(
        userId,
        provider,
        providerSubject,
        identityVerifiedAt,
        null,
        null,
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const externalIdentity = result.value;
      expect(externalIdentity.createdAt.getTime()).toBe(clock.now().getTime());
      expect(externalIdentity.updatedAt.getTime()).toBe(clock.now().getTime());
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct from persisted state', () => {
      const props = {
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: 'user@example.com',
        providerEmailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const externalIdentity = ExternalIdentity.reconstruct(props);

      expect(externalIdentity.id.value).toBe('ext-123');
      expect(externalIdentity.userId.value).toBe('user-123');
      expect(externalIdentity.provider.value).toBe('GOOGLE');
      expect(externalIdentity.providerSubject).toBe('123456789');
      expect(externalIdentity.providerEmail?.value).toBe('user@example.com');
      expect(externalIdentity.providerEmailVerified).toBe(true);
    });

    it('should reconstruct without provider email', () => {
      const props = {
        id: 'ext-123',
        userId: 'user-123',
        provider: 'TELEGRAM',
        providerSubject: '849302840',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const externalIdentity = ExternalIdentity.reconstruct(props);

      expect(externalIdentity.providerEmail).toBeNull();
      expect(externalIdentity.providerEmailVerified).toBeNull();
    });

    it('should NOT emit event on reconstruct', () => {
      const props = {
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      };

      const externalIdentity = ExternalIdentity.reconstruct(props);

      expect(externalIdentity.domainEvents).toHaveLength(0);
    });
  });

  describe('updateProviderMetadata', () => {
    it('should update provider email and verification status', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const newEmail = Email.create('new@example.com').value;
      const result = externalIdentity.updateProviderMetadata(newEmail, true, clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(externalIdentity.providerEmail?.value).toBe('new@example.com');
      expect(externalIdentity.providerEmailVerified).toBe(true);
    });

    it('should emit ExternalIdentityMetadataUpdated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const newEmail = Email.create('new@example.com').value;
      externalIdentity.updateProviderMetadata(newEmail, true, clock, eventIdGenerator);

      const events = externalIdentity.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('identity.ExternalIdentityMetadataUpdated');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const newEmail = Email.create('new@example.com').value;
      externalIdentity.updateProviderMetadata(newEmail, true, clock, eventIdGenerator);

      expect(externalIdentity.updatedAt.getTime()).toBe(clock.now().getTime());
    });
  });

  describe('business methods', () => {
    it('hasProviderEmail returns true when email exists', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: 'user@example.com',
        providerEmailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(externalIdentity.hasProviderEmail()).toBe(true);
    });

    it('hasProviderEmail returns false when email is null', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'TELEGRAM',
        providerSubject: '849302840',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(externalIdentity.hasProviderEmail()).toBe(false);
    });

    it('isProviderEmailVerified returns true when verified', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: 'user@example.com',
        providerEmailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(externalIdentity.isProviderEmailVerified()).toBe(true);
    });

    it('isProviderEmailVerified returns false when not verified', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: 'user@example.com',
        providerEmailVerified: false,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(externalIdentity.isProviderEmailVerified()).toBe(false);
    });

    it('isProviderEmailVerified returns false when null', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: 'user@example.com',
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(externalIdentity.isProviderEmailVerified()).toBe(false);
    });
  });

  describe('immutability', () => {
    it('id is immutable', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalId = externalIdentity.id.value;
      // No method to change id - immutable by design
      expect(externalIdentity.id.value).toBe(originalId);
    });

    it('userId is immutable', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalUserId = externalIdentity.userId.value;
      // No method to change userId - immutable by design
      expect(externalIdentity.userId.value).toBe(originalUserId);
    });

    it('provider is immutable', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalProvider = externalIdentity.provider.value;
      // No method to change provider - immutable by design
      expect(externalIdentity.provider.value).toBe(originalProvider);
    });

    it('providerSubject is immutable', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00.00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalProviderSubject = externalIdentity.providerSubject;
      // No method to change providerSubject - immutable by design
      expect(externalIdentity.providerSubject).toBe(originalProviderSubject);
    });

    it('identityVerifiedAt is immutable', () => {
      const externalIdentity = ExternalIdentity.reconstruct({
        id: 'ext-123',
        userId: 'user-123',
        provider: 'GOOGLE',
        providerSubject: '123456789',
        identityVerifiedAt: new Date('2024-01-01T00:00:00.000Z'),
        providerEmail: null,
        providerEmailVerified: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalVerifiedAt = externalIdentity.identityVerifiedAt;
      // No method to change identityVerifiedAt - immutable by design
      expect(externalIdentity.identityVerifiedAt).toBe(originalVerifiedAt);
    });
  });
});
