import { pgTable, uuid, text, integer, timestamp, jsonb, check, sql } from '@workspace/platform-database/drizzle-pg-core';

/**
 * outbox_events table
 * 
 * Domain: Event infrastructure (NOT a business aggregate)
 * 
 * Purpose: At-least-once event delivery with claim/lease semantics
 * 
 * Constraints:
 * - PK: id (UUID)
 * - CHECK: event_version >= 1
 * - CHECK: attempts >= 0
 * 
 * Claim/lease semantics:
 * - claimed_at: when a worker claimed this event
 * - claimed_by: worker identifier (e.g., hostname + pid)
 * - claim_expires_at: lease expiration for crash recovery
 * 
 * Retry semantics:
 * - attempts: number of delivery attempts
 * - last_error: last error message
 * - next_attempt_at: when to retry
 * 
 * Idempotency:
 * - published_at: when successfully published to external broker
 * - Consumer deduplication handled by event_consumption table
 * 
 * Note: This is infrastructure, not domain aggregate
 * Note: DEFAULT NOW() allowed on created_at for infrastructure records
 * Note: Indexes for dispatcher query alignment added manually in migration
 */
export const outboxEvents = pgTable('outbox_events', {
  id: uuid('id').primaryKey().notNull(),
  eventName: text('event_name').notNull(),
  eventVersion: integer('event_version').notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  claimedBy: text('claimed_by'),
  claimExpiresAt: timestamp('claim_expires_at', { withTimezone: true }),
}, (table) => ({
  eventVersionCheck: check('chk_outbox_events_event_version', sql`${table.eventVersion} >= 1`),
  attemptsCheck: check('chk_outbox_events_attempts', sql`${table.attempts} >= 0`),
}));

export type OutboxEventSelect = typeof outboxEvents.$inferSelect;
export type OutboxEventInsert = typeof outboxEvents.$inferInsert;
