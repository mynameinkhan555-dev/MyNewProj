/**
 * Tenant domain events.
 */

export interface TenantCreatedEvent {
  eventId: string;
  eventName: 'tenant.TenantCreated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'Tenant';
  tenantName: string;
}

export interface TenantActivatedEvent {
  eventId: string;
  eventName: 'tenant.TenantActivated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'Tenant';
}

export interface TenantSuspendedEvent {
  eventId: string;
  eventName: 'tenant.TenantSuspended';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'Tenant';
  reason: string;
}

export interface TenantDeletedEvent {
  eventId: string;
  eventName: 'tenant.TenantDeleted';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'Tenant';
}
