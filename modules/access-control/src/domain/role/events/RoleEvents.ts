/**
 * Role domain events.
 *
 * Events contain minimal business-critical data.
 * Excluded: displayName, description, internal object references.
 */

export interface RoleCreatedEvent {
  eventId: string;
  eventName: 'role.RoleCreated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'TenantRole' | 'PlatformRole';
  tenantId: string;
  roleKey: string;
}

export interface RoleDeletedEvent {
  eventId: string;
  eventName: 'role.RoleDeleted';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'TenantRole' | 'PlatformRole';
  tenantId: string;
  roleKey: string;
}
