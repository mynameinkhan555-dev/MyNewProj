import type { DomainEvent } from '@workspace/kernel';

export interface PasswordCredentialCreatedEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.PasswordCredentialCreated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'PasswordCredential';
  userId: string;
}

export interface PasswordCredentialChangedEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.PasswordCredentialChanged';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'PasswordCredential';
  userId: string;
}
