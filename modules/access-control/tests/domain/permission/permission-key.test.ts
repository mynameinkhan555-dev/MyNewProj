import { describe, it, expect } from 'vitest';
import { PermissionKey } from '@workspace/access-control';

describe('PermissionKey', () => {
  describe('create', () => {
    it('should create a valid permission key', () => {
      const result = PermissionKey.create('member.read');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const key = result.value;
        expect(key.value).toBe('member.read');
        expect(key.resource).toBe('member');
        expect(key.action).toBe('read');
      }
    });

    it('should trim whitespace', () => {
      const result = PermissionKey.create('  member.read  ');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const key = result.value;
        expect(key.value).toBe('member.read');
      }
    });

    it('should reject empty key', () => {
      const result = PermissionKey.create('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('PERMISSION_KEY_REQUIRED');
      }
    });

    it('should reject whitespace-only key', () => {
      const result = PermissionKey.create('   ');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('PERMISSION_KEY_REQUIRED');
      }
    });

    it('should reject single segment', () => {
      const result = PermissionKey.create('member');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('PERMISSION_KEY_INVALID_FORMAT');
      }
    });

    it('should reject empty segment', () => {
      const result = PermissionKey.create('member..read');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('PERMISSION_KEY_INVALID_SEGMENT');
      }
    });

    it('should accept three segments', () => {
      const result = PermissionKey.create('platform.user.manage');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const key = result.value;
        expect(key.value).toBe('platform.user.manage');
        expect(key.resource).toBe('platform');
        expect(key.action).toBe('user');
      }
    });

    it('should extract resource correctly', () => {
      const result = PermissionKey.create('tenant.update');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const key = result.value;
        expect(key.resource).toBe('tenant');
      }
    });

    it('should extract action correctly', () => {
      const result = PermissionKey.create('tenant.update');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const key = result.value;
        expect(key.action).toBe('update');
      }
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct from validated string', () => {
      const key = PermissionKey.reconstruct('member.read');

      expect(key.value).toBe('member.read');
      expect(key.resource).toBe('member');
      expect(key.action).toBe('read');
    });
  });

  describe('equals', () => {
    it('should return true for equal keys', () => {
      const key1 = PermissionKey.reconstruct('member.read');
      const key2 = PermissionKey.reconstruct('member.read');

      expect(key1.equals(key2)).toBe(true);
    });

    it('should return false for different keys', () => {
      const key1 = PermissionKey.reconstruct('member.read');
      const key2 = PermissionKey.reconstruct('member.update');

      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string value', () => {
      const key = PermissionKey.reconstruct('member.read');

      expect(key.toString()).toBe('member.read');
    });
  });
});
