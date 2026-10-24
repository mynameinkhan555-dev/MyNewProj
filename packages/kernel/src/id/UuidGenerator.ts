import { randomUUID } from 'node:crypto';
import type { IdGenerator } from './IdGenerator.js';

/**
 * Production ID generator using UUID v4.
 *
 * Uses cryptographically secure random UUID generation.
 * Suitable for distributed applications.
 */
export class UuidGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
