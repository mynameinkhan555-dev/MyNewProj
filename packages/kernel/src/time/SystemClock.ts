import type { Clock } from './Clock.js';

/**
 * Production clock implementation using system time.
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
