import { describe, it, expect } from 'vitest';
import { ExternalIdentityProvider } from '@workspace/identity';
import { DomainError } from '@workspace/kernel';

describe('ExternalIdentityProvider Value Object', () => {
  describe('create', () => {
    it('should create valid provider', () => {
      const result = ExternalIdentityProvider.create('google');

      expect(result.isOk()).toBe(true);
      const provider = result.value;
      expect(provider.value).toBe('GOOGLE');
    });

    it('should trim whitespace', () => {
      const result = ExternalIdentityProvider.create('  google  ');

      expect(result.isOk()).toBe(true);
      const provider = result.value;
      expect(provider.value).toBe('GOOGLE');
    });

    it('should normalize to uppercase', () => {
      const result = ExternalIdentityProvider.create('Google');

      expect(result.isOk()).toBe(true);
      const provider = result.value;
      expect(provider.value).toBe('GOOGLE');
    });

    it('should trim and normalize together', () => {
      const result = ExternalIdentityProvider.create('  Google  ');

      expect(result.isOk()).toBe(true);
      const provider = result.value;
      expect(provider.value).toBe('GOOGLE');
    });

    it('should allow valid provider with underscores', () => {
      const result = ExternalIdentityProvider.create('CUSTOM_OIDC');

      expect(result.isOk()).toBe(true);
      const provider = result.value;
      expect(provider.value).toBe('CUSTOM_OIDC');
    });

    it('should allow valid provider with numbers', () => {
      const result = ExternalIdentityProvider.create('PROVIDER_123');

      expect(result.isOk()).toBe(true);
      const provider = result.value;
      expect(provider.value).toBe('PROVIDER_123');
    });

    it('should reject empty string', () => {
      const result = ExternalIdentityProvider.create('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_PROVIDER');
      }
    });

    it('should reject whitespace-only string', () => {
      const result = ExternalIdentityProvider.create('   ');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_PROVIDER');
      }
    });

    it('should reject provider with special characters', () => {
      const result = ExternalIdentityProvider.create('google-oauth');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_PROVIDER');
      }
    });

    it('should reject provider with spaces', () => {
      const result = ExternalIdentityProvider.create('google oauth');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_PROVIDER');
      }
    });

    it('should reject provider exceeding max length', () => {
      const result = ExternalIdentityProvider.create('A'.repeat(51));

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_PROVIDER');
      }
    });
  });

  describe('equality', () => {
    it('should be equal with same canonical value', () => {
      const provider1 = ExternalIdentityProvider.create('google');
      const provider2 = ExternalIdentityProvider.create('GOOGLE');

      expect(provider1.isOk()).toBe(true);
      expect(provider2.isOk()).toBe(true);

      expect(provider1.value.equals(provider2.value)).toBe(true);
    });

    it('should be equal with trimmed whitespace', () => {
      const provider1 = ExternalIdentityProvider.create('google');
      const provider2 = ExternalIdentityProvider.create('  google  ');

      expect(provider1.isOk()).toBe(true);
      expect(provider2.isOk()).toBe(true);

      expect(provider1.value.equals(provider2.value)).toBe(true);
    });

    it('should not be equal with different canonical values', () => {
      const provider1 = ExternalIdentityProvider.create('google');
      const provider2 = ExternalIdentityProvider.create('github');

      expect(provider1.isOk()).toBe(true);
      expect(provider2.isOk()).toBe(true);

      expect(provider1.value.equals(provider2.value)).toBe(false);
    });
  });

  describe('value property', () => {
    it('should return canonical value', () => {
      const result = ExternalIdentityProvider.create('Google');

      expect(result.isOk()).toBe(true);
      const provider = result.value;
      expect(provider.value).toBe('GOOGLE');
    });

    it('should return trimmed canonical value', () => {
      const result = ExternalIdentityProvider.create('  Google  ');

      expect(result.isOk()).toBe(true);
      const provider = result.value;
      expect(provider.value).toBe('GOOGLE');
    });
  });

  describe('fromCanonical', () => {
    it('should create provider from canonical value bypassing validation', () => {
      const provider = ExternalIdentityProvider.fromCanonical('GOOGLE');

      expect(provider.value).toBe('GOOGLE');
    });

    it('should preserve value as-is', () => {
      const provider = ExternalIdentityProvider.fromCanonical('google');

      expect(provider.value).toBe('google');
    });
  });
});
