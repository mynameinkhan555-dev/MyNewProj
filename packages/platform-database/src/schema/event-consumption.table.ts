import { pgTable, uuid, text, timestamp } from '@workspace/platform-database/drizzle-pg-core';

/**
 * event_consumption table
 * 
 * Domain: Event infrastructure (NOT a business aggregate)
 * 
 * Purpose: Consumer idempotency - track which events have been consumed by which consumers
 * 
 * Constraints:
 * - PK: (event_id, consumer_id) composite (added manually in migration)
 * 
 * Semantics:
 * - event_id: references outbox_events.id
 * - consumer_id: consumer identifier (e.g., "email-service", "notification-worker")
 * - consumed_at: when the consumer successfully processed this event
 * 
 * Idempotency:
 * - Composite PK ensures each consumer processes each event exactly once
 * - Consumers check this table before processing
 * 
 * Note: This is infrastructure, not domain aggregate
 */
export const eventConsumption = pgTable('event_consumption', {
  eventId: uuid('event_id').notNull(),
  consumerId: text('consumer_id').notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }).notNull().defaultNow(),
});

export type EventConsumptionSelect = typeof eventConsumption.$inferSelect;
export type EventConsumptionInsert = typeof eventConsumption.$inferInsert;
