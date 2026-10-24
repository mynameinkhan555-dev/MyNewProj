/**
 * Marker interface for all domain events.
 * Every concrete event must supply a stable `eventName` (used for routing)
 * and the `occurredAt` timestamp.
 */
export interface DomainEvent {
  /** Globally unique event id — use crypto.randomUUID() or cuid2. */
  readonly eventId: string;
  /** Fully-qualified event type, e.g. "iam.UserRegistered". */
  readonly eventName: string;
  /** Event version for schema evolution (default: 1). */
  readonly eventVersion?: number;
  /** Wall-clock time the event was raised (ISO-8601). */
  readonly occurredAt: Date;
  /** Aggregate id that raised this event. */
  readonly aggregateId: string;
  /** Aggregate type, e.g. "User". */
  readonly aggregateType: string;
  /** Correlation ID for distributed tracing (propagated from request). */
  readonly correlationId?: string | null;
  /** Causation ID - ID of the command/event that caused this event. */
  readonly causationId?: string | null;
  /** User ID that initiated the event (if available). */
  readonly userId?: string | null;
  /** Session ID that initiated the event (if available). */
  readonly sessionId?: string | null;
  /** Metadata (additional context for auditing, tracing, etc.). */
  readonly metadata?: Readonly<Record<string, unknown>>;
}
