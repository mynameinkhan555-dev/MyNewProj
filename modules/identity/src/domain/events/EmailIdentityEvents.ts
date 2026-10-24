import type { DomainEvent } from '@workspace/kernel';

export interface EmailIdentityCreatedEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.EmailIdentityCreated';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'EmailIdentity';
  userId: string;
  email: string;
}

export interface EmailIdentityVerifiedEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.EmailIdentityVerified';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'EmailIdentity';
  userId: string;
  email: string;
}

export interface EmailIdentityPromotedToPrimaryEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.EmailIdentityPromotedToPrimary';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'EmailIdentity';
  userId: string;
  email: string;
}

export interface EmailIdentityDemotedFromPrimaryEvent extends DomainEvent {
  eventId: string;
  eventName: 'identity.EmailIdentityDemotedFromPrimary';
  occurredAt: Date;
  aggregateId: string;
  aggregateType: 'EmailIdentity';
  userId: string;
  email: string;
}
