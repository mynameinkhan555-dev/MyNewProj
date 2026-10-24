import { describe, it, expect } from 'vitest';
import {
  Tenant,
  TenantStatus,
  TenantId,
} from '@workspace/tenant';
import {
  TestClock,
  UuidGenerator,
  UuidEventIdGenerator,
} from '@workspace/kernel';

describe('Tenant', () => {
  describe('create', () => {
    it('should create a new tenant with ACTIVE status', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('Test Tenant', clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const tenant = result.value;
        expect(tenant.name).toBe('Test Tenant');
        expect(tenant.status).toBe(TenantStatus.ACTIVE);
        expect(tenant.createdAt).toEqual(clock.now());
        expect(tenant.updatedAt).toEqual(clock.now());
      }
    });

    it('should trim tenant name', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('  Test Tenant  ', clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const tenant = result.value;
        expect(tenant.name).toBe('Test Tenant');
      }
    });

    it('should return error if name is empty', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('', clock, idGenerator, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('TENANT_NAME_REQUIRED');
      }
    });

    it('should return error if name is whitespace only', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('   ', clock, idGenerator, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('TENANT_NAME_REQUIRED');
      }
    });

    it('should use injected IdGenerator for ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('Test Tenant', clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const tenant = result.value;
        expect(tenant.id.value).toBeTruthy();
      }
    });

    it('should use injected Clock for timestamps', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('Test Tenant', clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const tenant = result.value;
        expect(tenant.createdAt).toEqual(clock.now());
        expect(tenant.updatedAt).toEqual(clock.now());
      }
    });

    it('should emit TenantCreated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('Test Tenant', clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const tenant = result.value;
        const events = tenant.domainEvents;
        expect(events).toHaveLength(1);
        expect(events[0].eventName).toBe('tenant.TenantCreated');
      }
    });

    it('should use EventIdGenerator for event ID', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const idGenerator = new UuidGenerator();
      const eventIdGenerator = new UuidEventIdGenerator();

      const result = Tenant.create('Test Tenant', clock, idGenerator, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const tenant = result.value;
        const events = tenant.domainEvents;
        expect(events[0].eventId).toBeTruthy();
      }
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct tenant from persisted state', () => {
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      expect(tenant.id.value).toBe('tenant-123');
      expect(tenant.name).toBe('Test Tenant');
      expect(tenant.status).toBe(TenantStatus.ACTIVE);
    });

    it('should reconstruct with version', () => {
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        version: 5,
      });

      expect(tenant.version).toBe(5);
    });

    it('should reconstruct does not emit event', () => {
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const events = tenant.domainEvents;
      expect(events).toHaveLength(0);
    });
  });

  describe('activate', () => {
    it('should activate suspended tenant', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.SUSPENDED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.activate(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(tenant.status).toBe(TenantStatus.ACTIVE);
    });

    it('should return error if already active', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.activate(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('TENANT_ALREADY_ACTIVE');
      }
    });

    it('should return error if deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.DELETED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.activate(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('TENANT_DELETED');
      }
    });

    it('should emit TenantActivated event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.SUSPENDED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      tenant.activate(clock, eventIdGenerator);

      const events = tenant.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('tenant.TenantActivated');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.SUSPENDED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      tenant.activate(clock, eventIdGenerator);

      expect(tenant.updatedAt).toEqual(clock.now());
    });
  });

  describe('suspend', () => {
    it('should suspend active tenant', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(tenant.status).toBe(TenantStatus.SUSPENDED);
    });

    it('should return error if already suspended', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.SUSPENDED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('TENANT_ALREADY_SUSPENDED');
      }
    });

    it('should return error if deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.DELETED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.suspend('Test reason', clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('TENANT_DELETED');
      }
    });

    it('should emit TenantSuspended event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      tenant.suspend('Test reason', clock, eventIdGenerator);

      const events = tenant.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('tenant.TenantSuspended');
    });

    it('should include reason in event', () => {
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
      expect(event.reason).toBe('Policy violation');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      tenant.suspend('Test reason', clock, eventIdGenerator);

      expect(tenant.updatedAt).toEqual(clock.now());
    });
  });

  describe('delete', () => {
    it('should delete active tenant', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.delete(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(tenant.status).toBe(TenantStatus.DELETED);
    });

    it('should delete suspended tenant', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.SUSPENDED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.delete(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(tenant.status).toBe(TenantStatus.DELETED);
    });

    it('should return error if already deleted', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.DELETED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = tenant.delete(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('TENANT_ALREADY_DELETED');
      }
    });

    it('should emit TenantDeleted event', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      tenant.delete(clock, eventIdGenerator);

      const events = tenant.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('tenant.TenantDeleted');
    });

    it('should update updatedAt timestamp', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      tenant.delete(clock, eventIdGenerator);

      expect(tenant.updatedAt).toEqual(clock.now());
    });
  });

  describe('invalid transitions', () => {
    it('DELETED is terminal state', () => {
      const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
      const eventIdGenerator = new UuidEventIdGenerator();
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.DELETED,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      // All operations on DELETED tenant should fail
      const activateResult = tenant.activate(clock, eventIdGenerator);
      const suspendResult = tenant.suspend('Test reason', clock, eventIdGenerator);
      const deleteResult = tenant.delete(clock, eventIdGenerator);

      expect(activateResult.isErr()).toBe(true);
      expect(suspendResult.isErr()).toBe(true);
      expect(deleteResult.isErr()).toBe(true);
    });
  });

  describe('immutability', () => {
    it('id is immutable', () => {
      const tenant = Tenant.reconstruct({
        id: 'tenant-123',
        name: 'Test Tenant',
        status: TenantStatus.ACTIVE,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const originalId = tenant.id.value;
      // No method to change id - immutable by design
      expect(tenant.id.value).toBe(originalId);
    });
  });
});
