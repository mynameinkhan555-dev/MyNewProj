import { describe, it, expect } from 'vitest';
import { Email } from '@workspace/identity';
import { DomainError } from '@workspace/kernel';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      const result = Email.create('user@example.com');

      expect(result.isOk()).toBe(true);
      const email = result.value;
      expect(email.value).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const result = Email.create('  user@example.com  ');

      expect(result.isOk()).toBe(true);
      const email = result.value;
      expect(email.value).toBe('user@example.com');
    });

    it('should normalize to lowercase', () => {
      const result = Email.create('User@Example.COM');

      expect(result.isOk()).toBe(true);
      const email = result.value;
      expect(email.value).toBe('user@example.com');
    });

    it('should trim and normalize together', () => {
      const result = Email.create('  User@Example.COM  ');

      expect(result.isOk()).toBe(true);
      const email = result.value;
      expect(email.value).toBe('user@example.com');
    });

    it('should reject email without @', () => {
      const result = Email.create('invalid-email');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should reject email without domain', () => {
      const result = Email.create('user@');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should reject email without local part', () => {
      const result = Email.create('@example.com');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should reject email without domain dot', () => {
      const result = Email.create('user@example');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should reject email with whitespace', () => {
      const result = Email.create('user @example.com');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should reject empty string', () => {
      const result = Email.create('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });

    it('should reject whitespace-only string', () => {
      const result = Email.create('   ');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_EMAIL');
      }
    });
  });

  describe('equality', () => {
    it('should be equal with same canonical value', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('USER@EXAMPLE.COM');

      expect(email1.isOk()).toBe(true);
      expect(email2.isOk()).toBe(true);

      expect(email1.value.equals(email2.value)).toBe(true);
    });

    it('should be equal with trimmed whitespace', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('  user@example.com  ');

      expect(email1.isOk()).toBe(true);
      expect(email2.isOk()).toBe(true);

      expect(email1.value.equals(email2.value)).toBe(true);
    });

    it('should not be equal with different canonical values', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('other@example.com');

      expect(email1.isOk()).toBe(true);
      expect(email2.isOk()).toBe(true);

      expect(email1.value.equals(email2.value)).toBe(false);
    });

    it('should not be equal with different domains', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@other.com');

      expect(email1.isOk()).toBe(true);
      expect(email2.isOk()).toBe(true);

      expect(email1.value.equals(email2.value)).toBe(false);
    });
  });

  describe('value property', () => {
    it('should return canonical value', () => {
      const result = Email.create('User@Example.COM');

      expect(result.isOk()).toBe(true);
      const email = result.value;
      expect(email.value).toBe('user@example.com');
    });

    it('should return trimmed canonical value', () => {
      const result = Email.create('  User@Example.COM  ');

      expect(result.isOk()).toBe(true);
      const email = result.value;
      expect(email.value).toBe('user@example.com');
    });
  });
});
