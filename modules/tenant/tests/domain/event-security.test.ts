import { describe, it, expect } from 'vitest';
import {
  Tenant,
  Membership,
  TenantStatus,
  MembershipStatus as MembershipStatusEnum,
  TenantId,
} from '@workspace/tenant';
import { UserId } from '@workspace/identity';
import {
  TestClock,
  UuidGenerator,
  UuidEventIdGenerator,
} from '@workspace/kernel';

describe('Tenant Event Security', () => {
  describe('TenantCreatedEvent', () => {
    it('should not expose sensitive data', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('Test Tenant', clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const tenant = result.value;
        const events = tenant.domainEvents;
        const event = events[0] as any;

        // Event should only contain tenantName (safe)
        expect(event.tenantName).toBe('Test Tenant');
        // No sensitive data (secrets, tokens, etc.)
        expect(event.password).toBeUndefined();
        expect(event.apiKey).toBeUndefined();
        expect(event.secret).toBeUndefined();
      }
    });
  });

  describe('TenantSuspendedEvent', () => {
    it('should not expose sensitive data', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      tenant.suspend('Policy violation', clock, eventIdGenerator);

      const events = tenant.domainEvents;
      const event = events[0] as any;

      // Event should only contain reason (safe)
      expect(event.reason).toBe('Policy violation');
      // No sensitive data
      expect(event.password).toBeUndefined();
      expect(event.apiKey).toBeUndefined();
      expect(event.secret).toBeUndefined();
    });
  });
});

describe('Membership Event Security', () => {
  describe('MembershipCreatedEvent', () => {
    it('should not expose sensitive data', () => {
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
        const event = events[0] as any;

        // Event should only contain userId and tenantId (identifiers)
        expect(event.userId).toBe('user-123');
        expect(event.tenantId).toBe('tenant-123');
        // No sensitive data
        expect(event.password).toBeUndefined();
        expect(event.apiKey).toBeUndefined();
        expect(event.secret).toBeUndefined();
        expect(event.token).toBeUndefined();
      }
    });
  });

  describe('MembershipSuspendedEvent', () => {
    it('should not expose sensitive data', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const membership = Membership.reconstruct({
        id: 'membership-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        status: MembershipStatusEnum.ACTIVE,
        joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      membership.suspend('Policy violation', clock, eventIdGenerator);

      const events = membership.domainEvents;
      const event = events[0] as any;

      // Event should only contain userId, tenantId, and reason
      expect(event.userId).toBe('user-123');
      expect(event.tenantId).toBe('tenant-123');
      expect(event.reason).toBe('Policy violation');
      // No sensitive data
      expect(event.password).toBeUndefined();
      expect(event.apiKey).toBeUndefined();
      expect(event.secret).toBeUndefined();
      expect(event.token).toBeUndefined();
    });
  });
});
