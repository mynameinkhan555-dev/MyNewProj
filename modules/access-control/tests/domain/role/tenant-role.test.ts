import { describe, it, expect } from 'vitest';
import { TenantRole } from '../../../src/domain/role/TenantRole.js';
import { TenantId } from '@workspace/tenant';
import { RoleStatus } from '../../../src/domain/role/RoleStatus.js';
import { TestClock, UuidGenerator, UuidEventIdGenerator } from '@workspace/kernel';

describe('TenantRole', () => {
  const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
  const idGenerator = new UuidGenerator();
  const eventIdGenerator = new UuidEventIdGenerator();
  const tenantId = new TenantId(idGenerator.generate());

  describe('create', () => {
    it('should create a valid tenant role', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Full admin access',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const role = result.value;

      expect(role.id.value).toBeDefined();
      expect(role.tenantId.value).toBe(tenantId.value);
      expect(role.key.value).toBe('admin');
      expect(role.displayName).toBe('Administrator');
      expect(role.description).toBe('Full admin access');
      expect(role.status).toBe(RoleStatus.ACTIVE);
      expect(role.createdAt).toEqual(clock.now());
      expect(role.updatedAt).toEqual(clock.now());
    });

    it('should trim display name', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        '  Administrator  ',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      expect(result.value.displayName).toBe('Administrator');
    });

    it('should emit RoleCreated event', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isOk()).toBe(true);
      const role = result.value;

      const events = role.domainEvents;
      expect(events.length).toBe(1);

      const event = events[0];
      expect(event.eventName).toBe('role.RoleCreated');
      expect(event.aggregateType).toBe('TenantRole');
      expect(event.tenantId).toBe(tenantId.value);
      expect(event.roleKey).toBe('admin');
      expect(event.aggregateId).toBe(role.id.value);
      expect(event.occurredAt).toEqual(clock.now());
    });

    it('should reject invalid role key', () => {
      const result = TenantRole.create(
        tenantId,
        'Admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_INVALID');
    });

    it('should reject empty display name', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        '',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('DISPLAY_NAME_REQUIRED');
    });

    it('should reject whitespace-only display name', () => {
      const result = TenantRole.create(
        tenantId,
        'admin',
        '   ',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      );

      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('DISPLAY_NAME_REQUIRED');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct tenant role from persisted state', () => {
      const props = {
        id: idGenerator.generate(),
        tenantId: tenantId.value,
        key: 'admin',
        status: RoleStatus.ACTIVE,
        displayName: 'Administrator',
        description: 'Full admin access',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        version: 5,
      };

      const role = TenantRole.reconstruct(props);

      expect(role.id.value).toBe(props.id);
      expect(role.tenantId.value).toBe(props.tenantId);
      expect(role.key.value).toBe(props.key);
      expect(role.status).toBe(props.status);
      expect(role.displayName).toBe(props.displayName);
      expect(role.description).toBe(props.description);
      expect(role.createdAt).toEqual(props.createdAt);
      expect(role.updatedAt).toEqual(props.updatedAt);
      expect(role.version).toBe(5);
    });

    it('should reconstruct without emitting events', () => {
      const props = {
        id: idGenerator.generate(),
        tenantId: tenantId.value,
        key: 'admin',
        status: RoleStatus.ACTIVE,
        displayName: 'Administrator',
        description: 'Description',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const role = TenantRole.reconstruct(props);
      const events = role.domainEvents;

      expect(events.length).toBe(0);
    });
  });

  describe('updateDisplay', () => {
    it('should update display name and description', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();
      clock.advanceBy(1000);

      const result = role.updateDisplay('Super Admin', 'Updated description', clock);

      expect(result.isOk()).toBe(true);
      expect(role.displayName).toBe('Super Admin');
      expect(role.description).toBe('Updated description');
      expect(role.updatedAt).toEqual(clock.now());
    });

    it('should trim display name on update', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();

      const result = role.updateDisplay('  Super Admin  ', 'Description', clock);

      expect(result.isOk()).toBe(true);
      expect(role.displayName).toBe('Super Admin');
    });

    it('should not emit event on display update', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();

      role.updateDisplay('Super Admin', 'Description', clock);

      const events = role.domainEvents;
      expect(events.length).toBe(0);
    });

    it('should reject update if role is deleted', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();
      role.delete(clock, eventIdGenerator);

      const result = role.updateDisplay('Super Admin', 'Description', clock);

      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_DELETED');
    });

    it('should reject empty display name on update', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();

      const result = role.updateDisplay('', 'Description', clock);

      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('DISPLAY_NAME_REQUIRED');
    });
  });

  describe('delete', () => {
    it('should delete role and emit event', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();
      clock.advanceBy(1000);

      const result = role.delete(clock, eventIdGenerator);

      expect(result.isOk()).toBe(true);
      expect(role.status).toBe(RoleStatus.DELETED);
      expect(role.updatedAt).toEqual(clock.now());

      const events = role.domainEvents;
      expect(events.length).toBe(1);

      const event = events[0];
      expect(event.eventName).toBe('role.RoleDeleted');
      expect(event.aggregateType).toBe('TenantRole');
      expect(event.tenantId).toBe(tenantId.value);
      expect(event.roleKey).toBe('admin');
      expect(event.aggregateId).toBe(role.id.value);
    });

    it('should reject delete if already deleted', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      role.pullDomainEvents();
      role.delete(clock, eventIdGenerator);

      const result = role.delete(clock, eventIdGenerator);

      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_ALREADY_DELETED');
    });
  });

  describe('identity immutability', () => {
    it('should have immutable id', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const originalId = role.id.value;
      role.updateDisplay('New Name', 'Description', clock);

      expect(role.id.value).toBe(originalId);
    });

    it('should have immutable tenantId', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const originalTenantId = role.tenantId.value;
      role.updateDisplay('New Name', 'Description', clock);

      expect(role.tenantId.value).toBe(originalTenantId);
    });

    it('should have immutable key', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const originalKey = role.key.value;
      role.updateDisplay('New Name', 'Description', clock);

      expect(role.key.value).toBe(originalKey);
    });

    it('should have immutable createdAt', () => {
      const role = TenantRole.create(
        tenantId,
        'admin',
        'Administrator',
        'Description',
        clock,
        idGenerator,
        eventIdGenerator,
      ).value;

      const originalCreatedAt = role.createdAt;
      clock.advanceBy(1000);
      role.updateDisplay('New Name', 'Description', clock);

      expect(role.createdAt).toEqual(originalCreatedAt);
    });
  });
});
