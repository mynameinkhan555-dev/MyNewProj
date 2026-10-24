import { randomUUID } from 'node:crypto';
import type { EventIdGenerator } from './EventIdGenerator.js';

/**
 * Production event ID generator using UUID v4.
 *
 * Uses cryptographically secure random UUID generation.
 * Suitable for distributed applications and event sourcing.
 */
export class UuidEventIdGenerator implements EventIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
