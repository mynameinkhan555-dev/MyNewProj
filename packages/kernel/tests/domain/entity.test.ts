import { describe, it, expect } from 'vitest';
import { Entity } from '@workspace/kernel/domain/Entity.js';
import { UniqueId } from '@workspace/kernel/domain/UniqueId.js';

class TestEntity extends Entity<UniqueId> {
  protected readonly entityType = 'TestEntity';

  constructor(id: UniqueId) {
    super(id);
  }
}

class AnotherEntity extends Entity<UniqueId> {
  protected readonly entityType = 'AnotherEntity';

  constructor(id: UniqueId) {
    super(id);
  }
}

describe('Entity', () => {
  it('should have identity-based equality for same concrete type', () => {
    const id = new UniqueId('123');
    const entity1 = new TestEntity(id);
    const entity2 = new TestEntity(id);

    expect(entity1.equals(entity2)).toBe(true);
  });

  it('should not be equal when IDs differ', () => {
    const entity1 = new TestEntity(new UniqueId('123'));
    const entity2 = new TestEntity(new UniqueId('456'));

    expect(entity1.equals(entity2)).toBe(false);
  });

  it('should be equal to itself', () => {
    const entity = new TestEntity(new UniqueId('123'));

    expect(entity.equals(entity)).toBe(true);
  });

  it('should not be equal when concrete types differ, even with same ID', () => {
    const id = new UniqueId('123');
    const entity1 = new TestEntity(id);
    const entity2 = new AnotherEntity(id);

    expect(entity1.equals(entity2)).toBe(false);
  });

  it('should expose ID safely', () => {
    const id = new UniqueId('123');
    const entity = new TestEntity(id);

    expect(entity.id).toBe(id);
    expect(entity.id.value).toBe('123');
  });
});
