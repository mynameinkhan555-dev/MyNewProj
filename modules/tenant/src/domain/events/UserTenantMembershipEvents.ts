import type { DomainEvent } from '@workspace/kernel';

export interface MembershipCreatedEvent extends DomainEvent {
  aggregateId: string;
  eventType: 'MembershipCreated';
  userId: string;
  tenantId: string;
  role: string;
}

export interface MembershipRoleChangedEvent extends DomainEvent {
  aggregateId: string;
  eventType: 'MembershipRoleChanged';
  oldRole: string;
  newRole: string;
}

export interface MembershipDeletedEvent extends DomainEvent {
  aggregateId: string;
  eventType: 'MembershipDeleted';
  userId: string;
  tenantId: string;
}
