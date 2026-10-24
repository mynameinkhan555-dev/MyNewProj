import type { DomainEvent } from '@workspace/kernel';

export interface MembershipCreatedEvent extends DomainEvent {
  aggregateId: string;
  eventType: 'MembershipCreated';
  userId: string;
  tenantId: string;
}

export interface MembershipActivatedEvent extends DomainEvent {
  aggregateId: string;
  eventType: 'MembershipActivated';
  userId: string;
  tenantId: string;
}

export interface MembershipSuspendedEvent extends DomainEvent {
  aggregateId: string;
  eventType: 'MembershipSuspended';
  userId: string;
  tenantId: string;
}

export interface MembershipDeletedEvent extends DomainEvent {
  aggregateId: string;
  eventType: 'MembershipDeleted';
  userId: string;
  tenantId: string;
}
