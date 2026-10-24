import { describe, it, expect } from 'vitest';
import { RoleKey } from '../../../src/domain/role/RoleKey.js';

describe('RoleKey', () => {
  describe('create', () => {
    it('should create valid role key', () => {
      const result = RoleKey.create('admin');
      expect(result.isOk()).toBe(true);
      expect(result.value.value).toBe('admin');
    });

    it('should create role key with hyphen', () => {
      const result = RoleKey.create('billing-admin');
      expect(result.isOk()).toBe(true);
      expect(result.value.value).toBe('billing-admin');
    });

    it('should create role key with underscore', () => {
      const result = RoleKey.create('super_admin');
      expect(result.isOk()).toBe(true);
      expect(result.value.value).toBe('super_admin');
    });

    it('should create role key with numbers', () => {
      const result = RoleKey.create('admin2');
      expect(result.isOk()).toBe(true);
      expect(result.value.value).toBe('admin2');
    });

    it('should trim whitespace', () => {
      const result = RoleKey.create('  admin  ');
      expect(result.isOk()).toBe(true);
      expect(result.value.value).toBe('admin');
    });

    it('should reject empty string', () => {
      const result = RoleKey.create('');
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_EMPTY');
    });

    it('should reject whitespace-only string', () => {
      const result = RoleKey.create('   ');
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_EMPTY');
    });

    it('should reject undefined', () => {
      const result = RoleKey.create(undefined as any);
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_EMPTY');
    });

    it('should reject null', () => {
      const result = RoleKey.create(null as any);
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_EMPTY');
    });

    it('should reject too short key (1 char)', () => {
      const result = RoleKey.create('a');
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_TOO_SHORT');
    });

    it('should reject too long key (>100 chars)', () => {
      const longKey = 'a'.repeat(101);
      const result = RoleKey.create(longKey);
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_TOO_LONG');
    });

    it('should reject uppercase letters', () => {
      const result = RoleKey.create('Admin');
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_INVALID');
    });

    it('should reject spaces', () => {
      const result = RoleKey.create('admin role');
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_INVALID');
    });

    it('should reject special characters', () => {
      const result = RoleKey.create('admin@role');
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_INVALID');
    });

    it('should reject dots', () => {
      const result = RoleKey.create('admin.role');
      expect(result.isErr()).toBe(true);
      expect(result.error.code).toBe('ROLE_KEY_INVALID');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct role key without validation', () => {
      const key = RoleKey.reconstruct('admin');
      expect(key.value).toBe('admin');
    });

    it('should reconstruct any string', () => {
      const key = RoleKey.reconstruct('INVALID.KEY');
      expect(key.value).toBe('INVALID.KEY');
    });
  });

  describe('equals', () => {
    it('should return true for equal keys', () => {
      const key1 = RoleKey.create('admin').value;
      const key2 = RoleKey.create('admin').value;
      expect(key1.equals(key2)).toBe(true);
    });

    it('should return false for different keys', () => {
      const key1 = RoleKey.create('admin').value;
      const key2 = RoleKey.create('member').value;
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string value', () => {
      const key = RoleKey.create('admin').value;
      expect(key.toString()).toBe('admin');
    });
  });
});
