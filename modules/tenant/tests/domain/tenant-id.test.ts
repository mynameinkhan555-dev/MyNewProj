import { describe, it, expect } from 'vitest';
import { TenantId } from '@workspace/tenant';

describe('TenantId', () => {
  describe('constructor', () => {
    it('should create a valid TenantId', () => {
      const id = new TenantId('tenant-123');
      expect(id.value).toBe('tenant-123');
    });

    it('should throw error if value is empty', () => {
      expect(() => new TenantId('')).toThrow('UniqueId value cannot be empty');
    });

    it('should throw error if value is whitespace only', () => {
      expect(() => new TenantId('   ')).toThrow('UniqueId value cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for equal IDs', () => {
      const id1 = new TenantId('tenant-123');
      const id2 = new TenantId('tenant-123');
      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const id1 = new TenantId('tenant-123');
      const id2 = new TenantId('tenant-456');
      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string value', () => {
      const id = new TenantId('tenant-123');
      expect(id.toString()).toBe('tenant-123');
    });
  });
});
