/**
 * RoleAssignment domain events.
 *
 * Events contain minimal business-critical data.
 * Excluded: internal object references, userId, tenantId (available through relationships).
 */

export interface RoleAssignmentCreatedEvent {
  eventId: string;
  eventName: 'roleAssignment.RoleAssignmentCreated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'RoleAssignment';
  membershipId: string;
  roleId: string;
}

export interface RoleAssignmentDeletedEvent {
  eventId: string;
  eventName: 'roleAssignment.RoleAssignmentDeleted';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'RoleAssignment';
  membershipId: string;
  roleId: string;
}
