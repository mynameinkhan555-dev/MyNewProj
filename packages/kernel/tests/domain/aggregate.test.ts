import { describe, it, expect } from 'vitest';
import { AggregateRoot } from '@workspace/kernel/domain/AggregateRoot.js';
import { UniqueId } from '@workspace/kernel/domain/UniqueId.js';
import type { DomainEvent } from '@workspace/kernel/domain/DomainEvent.js';

class TestAggregate extends AggregateRoot<UniqueId> {
  constructor(id: UniqueId) {
    super(id);
  }
}

describe('AggregateRoot', () => {
  it('should manage domain events', () => {
    const aggregate = new TestAggregate(new UniqueId('123'));
    const event: DomainEvent = {
      eventId: 'evt-1',
      eventName: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: '123',
      aggregateType: 'TestAggregate',
    };

    aggregate.addDomainEvent(event);

    expect(aggregate.domainEvents).toHaveLength(1);
    expect(aggregate.domainEvents[0]).toBe(event);
  });

  it('should pull and clear events', () => {
    const aggregate = new TestAggregate(new UniqueId('123'));
    const event: DomainEvent = {
      eventId: 'evt-1',
      eventName: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: '123',
      aggregateType: 'TestAggregate',
    };

    aggregate.addDomainEvent(event);
    const pulled = aggregate.pullDomainEvents();

    expect(pulled).toHaveLength(1);
    expect(pulled[0]).toBe(event);
    expect(aggregate.domainEvents).toHaveLength(0);
  });

  it('should increment version on apply', () => {
    const aggregate = new TestAggregate(new UniqueId('123'));
    const event: DomainEvent = {
      eventId: 'evt-1',
      eventName: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: '123',
      aggregateType: 'TestAggregate',
    };

    expect(aggregate.version).toBe(0);

    aggregate.apply(event);

    expect(aggregate.version).toBe(1);
  });

  it('should add event on apply', () => {
    const aggregate = new TestAggregate(new UniqueId('123'));
    const event: DomainEvent = {
      eventId: 'evt-1',
      eventName: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: '123',
      aggregateType: 'TestAggregate',
    };

    aggregate.apply(event);

    expect(aggregate.domainEvents).toHaveLength(1);
  });

  it('should increment version on each apply (aggregate-level change tracking)', () => {
    const aggregate = new TestAggregate(new UniqueId('123'));
    const event1: DomainEvent = {
      eventId: 'evt-1',
      eventName: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: '123',
      aggregateType: 'TestAggregate',
    };
    const event2: DomainEvent = {
      eventId: 'evt-2',
      eventName: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: '123',
      aggregateType: 'TestAggregate',
    };

    expect(aggregate.version).toBe(0);

    aggregate.apply(event1);
    expect(aggregate.version).toBe(1);

    aggregate.apply(event2);
    expect(aggregate.version).toBe(2);

    // Note: This version is for aggregate-level change tracking.
    // Repository-level optimistic concurrency is a separate concern.
  });

  it('should record event visibility before draining', () => {
    const aggregate = new TestAggregate(new UniqueId('123'));
    const event: DomainEvent = {
      eventId: 'evt-1',
      eventName: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: '123',
      aggregateType: 'TestAggregate',
    };

    aggregate.addDomainEvent(event);

    expect(aggregate.domainEvents).toHaveLength(1);
    expect(aggregate.domainEvents[0]).toBe(event);
  });

  it('should clear events after draining', () => {
    const aggregate = new TestAggregate(new UniqueId('123'));
    const event: DomainEvent = {
      eventId: 'evt-1',
      eventName: 'TestEvent',
      occurredAt: new Date(),
      aggregateId: '123',
      aggregateType: 'TestAggregate',
    };

    aggregate.addDomainEvent(event);
    aggregate.pullDomainEvents();

    expect(aggregate.domainEvents).toHaveLength(0);
  });
});
