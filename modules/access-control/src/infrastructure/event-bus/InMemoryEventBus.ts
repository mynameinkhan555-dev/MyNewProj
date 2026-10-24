import type { DomainEvent } from '@workspace/kernel';
import type { IEventBus } from '../../domain/events/IEventBus.js';

/**
 * In-memory event bus implementation for development/testing.
 * 
 * In production, this would be replaced with a persistent event bus
 * (e.g., PostgreSQL outbox, Kafka, RabbitMQ).
 */
export class InMemoryEventBus implements IEventBus {
  private handlers: Map<string, (event: DomainEvent) => Promise<void>> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    // In production, this would persist to an outbox table
    // For now, just log the event
    console.log(`[EventBus] Publishing event: ${event.eventName}`, event);
    
    // Call registered handlers (if any)
    const handler = this.handlers.get(event.eventName);
    if (handler) {
      await handler(event);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Register a handler for a specific event type.
   * This is useful for testing or simple in-memory event handling.
   */
  on(eventName: string, handler: (event: DomainEvent) => Promise<void>): void {
    this.handlers.set(eventName, handler);
  }

  /**
   * Clear all handlers.
   */
  clear(): void {
    this.handlers.clear();
  }
}
