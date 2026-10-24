import { describe, it, expect } from 'vitest';
import { UuidGenerator } from '@workspace/kernel/id/UuidGenerator.js';
import { FakeIdGenerator } from '@workspace/kernel/id/FakeIdGenerator.js';

describe('UuidGenerator', () => {
  it('should generate valid UUIDs', () => {
    const generator = new UuidGenerator();
    const id = generator.generate();

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('should generate different UUIDs on consecutive calls', () => {
    const generator = new UuidGenerator();
    const id1 = generator.generate();
    const id2 = generator.generate();

    expect(id1).not.toBe(id2);
  });
});

describe('FakeIdGenerator', () => {
  it('should return predetermined IDs in sequence', () => {
    const generator = new FakeIdGenerator(['id-1', 'id-2', 'id-3']);

    expect(generator.generate()).toBe('id-1');
    expect(generator.generate()).toBe('id-2');
    expect(generator.generate()).toBe('id-3');
  });

  it('should throw when all test IDs are exhausted', () => {
    const generator = new FakeIdGenerator(['id-1']);

    generator.generate();

    expect(() => generator.generate()).toThrow('No more test IDs available');
  });

  it('should throw on first call if no IDs provided', () => {
    const generator = new FakeIdGenerator([]);

    expect(() => generator.generate()).toThrow('No more test IDs available');
  });
});
