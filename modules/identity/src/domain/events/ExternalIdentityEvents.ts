import type { DomainEvent } from '@workspace/kernel';

export interface ExternalIdentityCreatedEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.ExternalIdentityCreated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'ExternalIdentity';
  userId: string;
  provider: string;
  providerSubject: string;
}

export interface ExternalIdentityMetadataUpdatedEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.ExternalIdentityMetadataUpdated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'ExternalIdentity';
  userId: string;
  provider: string;
  providerSubject: string;
  providerEmail: string | null;
  providerEmailVerified: boolean | null;
}
