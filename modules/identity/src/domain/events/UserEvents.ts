import type { DomainEvent } from '@workspace/kernel';

/**
 * Emitted when a new User is created.
 */
export interface UserCreatedEvent extends DomainEvent {
  readonly eventName: 'identity.UserCreated';
  readonly aggregateType: 'User';
  readonly userId: string;
}

/**
 * Emitted when a User is activated.
 */
export interface UserActivatedEvent extends DomainEvent {
  readonly eventName: 'identity.UserActivated';
  readonly aggregateType: 'User';
  readonly userId: string;
}

/**
 * Emitted when a User is suspended.
 */
export interface UserSuspendedEvent extends DomainEvent {
  readonly eventName: 'identity.UserSuspended';
  readonly aggregateType: 'User';
  readonly userId: string;
  readonly reason?: string;
}

/**
 * Emitted when a User is deleted.
 */
export interface UserDeletedEvent extends DomainEvent {
  readonly eventName: 'identity.UserDeleted';
  readonly aggregateType: 'User';
  readonly userId: string;
}
