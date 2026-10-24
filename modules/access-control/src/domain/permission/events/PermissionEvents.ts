/**
 * Permission domain events.
 */

export interface PermissionCreatedEvent {
  eventId: string;
  eventName: 'permission.PermissionCreated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: string;
  permissionKey: string;
  scope: 'TENANT' | 'PLATFORM';
}

export interface PermissionDeletedEvent {
  eventId: string;
  eventName: 'permission.PermissionDeleted';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: string;
  permissionKey: string;
  scope: 'TENANT' | 'PLATFORM';
}
