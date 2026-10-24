import type { Clock } from './Clock.js';

/**
 * Deterministic clock for testing.
 *
 * Allows setting a fixed time and advancing it by specific amounts.
 * This enables deterministic tests for time-dependent domain logic.
 */
export class TestClock implements Clock {
  #currentTime: Date;

  constructor(initialTime?: Date) {
    this.#currentTime = initialTime ?? new Date('2024-01-01T00:00:00.000Z');
  }

  now(): Date {
    return new Date(this.#currentTime);
  }

  /**
   * Set the current time to a specific moment.
   */
  setTime(time: Date): void {
    this.#currentTime = new Date(time);
  }

  /**
   * Advance the clock by a specified number of milliseconds.
   */
  advanceBy(ms: number): void {
    this.#currentTime = new Date(this.#currentTime.getTime() + ms);
  }

  /**
   * Reset the clock to a specific moment.
   */
  reset(time?: Date): void {
    this.#currentTime = time ?? new Date('2024-01-01T00:00:00.000Z');
  }
}
