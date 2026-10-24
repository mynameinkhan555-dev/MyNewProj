import { describe, it, expect } from 'vitest';
import {
  User,
  EmailIdentity,
  ExternalIdentity,
  PasswordCredential,
  Session,
  UserId,
  Email,
  ExternalIdentityProvider,
} from '@workspace/identity';
import {
  type Clock,
  TestClock,
  UuidGenerator,
  UuidEventIdGenerator,
} from '@workspace/kernel';

describe('Domain Event Security', () => {
  describe('event payload security', () => {
    it('PasswordCredentialCreatedEvent does not expose hashedPassword', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();
      const userId = new UserId('user-123');
      const hashedPassword = '$2b$10$hashedPasswordString123';

      const result = PasswordCredential.create(userId, hashedPassword, clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      const credential = result.value;
      const events = credential.domainEvents;
      const event = events[0] as any;

      // Event should NOT contain hashedPassword
      expect(event.hashedPassword).toBeUndefined();
    });

    it('PasswordCredentialChangedEvent does not expose hashedPassword', () => {
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
      const event = events[0] as any;

      // Event should NOT contain hashedPassword
      expect(event.hashedPassword).toBeUndefined();
    });

    it('SessionRevokedEvent does not expose refreshTokenHash', () => {
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
      const event = events[0] as any;

      // Event should NOT contain refreshTokenHash
      expect(event.refreshTokenHash).toBeUndefined();
    });

    it('ExternalIdentityCreatedEvent does not expose OAuth tokens', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.00Z'));
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
      const event = events[0] as any;

      // Event should NOT contain OAuth tokens
      expect(event.accessToken).toBeUndefined();
      expect(event.refreshToken).toBeUndefined();
      expect(event.clientSecret).toBeUndefined();
    });

    it('ExternalIdentityMetadataUpdatedEvent does not expose OAuth tokens', () => {
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
      const event = events[0] as any;

      // Event should NOT contain OAuth tokens
      expect(event.accessToken).toBeUndefined();
      expect(event.refreshToken).toBeUndefined();
      expect(event.clientSecret).toBeUndefined();
    });
  });
});
