import type { IdGenerator } from './IdGenerator.js';

/**
 * Fake ID generator for testing.
 *
 * Allows providing a predetermined sequence of IDs for deterministic tests.
 * Throws when all test IDs are exhausted, making test failures explicit.
 */
export class FakeIdGenerator implements IdGenerator {
  constructor(private readonly ids: string[]) {}

  generate(): string {
    const id = this.ids.shift();

    if (!id) {
      throw new Error('No more test IDs available');
    }

    return id;
  }
}
