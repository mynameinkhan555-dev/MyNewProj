import { describe, it, expect } from 'vitest';
import { SystemClock } from '@workspace/kernel/time/SystemClock.js';
import { TestClock } from '@workspace/kernel/time/TestClock.js';

describe('SystemClock', () => {
  it('should return current time', () => {
    const clock = new SystemClock();
    const now = clock.now();

    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThan(0);
  });

  it('should return different times on consecutive calls', () => {
    const clock = new SystemClock();
    const now1 = clock.now();
    const now2 = clock.now();

    expect(now2.getTime()).toBeGreaterThanOrEqual(now1.getTime());
  });
});

describe('TestClock', () => {
  it('should return deterministic time', () => {
    const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));
    const now = clock.now();

    expect(now.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should advance time by specified milliseconds', () => {
    const clock = new TestClock(new Date('2024-01-01T00:00:00.000Z'));

    clock.advanceBy(1000);

    expect(clock.now().toISOString()).toBe('2024-01-01T00:00:01.000Z');
  });

  it('should allow setting time', () => {
    const clock = new TestClock();

    clock.setTime(new Date('2024-06-15T12:30:00.000Z'));

    expect(clock.now().toISOString()).toBe('2024-06-15T12:30:00.000Z');
  });

  it('should reset to default time', () => {
    const clock = new TestClock(new Date('2024-12-31T23:59:59.999Z'));

    clock.reset();

    expect(clock.now().toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should reset to specified time', () => {
    const clock = new TestClock();

    clock.reset(new Date('2024-03-15T10:00:00.000Z'));

    expect(clock.now().toISOString()).toBe('2024-03-15T10:00:00.000Z');
  });
});
