import type { DomainEvent } from '@workspace/kernel';

export interface SessionRevokedEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.SessionRevoked';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'Session';
  userId: string;
}
