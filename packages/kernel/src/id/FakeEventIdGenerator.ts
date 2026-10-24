import type { EventIdGenerator } from './EventIdGenerator.js';

/**
 * Fake event ID generator for testing.
 *
 * Allows providing a predetermined sequence of event IDs for deterministic tests.
 * Throws when all test event IDs are exhausted, making test failures explicit.
 */
export class FakeEventIdGenerator implements EventIdGenerator {
  constructor(private readonly ids: string[]) {}

  generate(): string {
    const id = this.ids.shift();

    if (!id) {
      throw new Error('No more test event IDs available');
    }

    return id;
  }
}
