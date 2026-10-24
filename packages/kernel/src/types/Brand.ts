/**
 * Nominal / branded type helper.
 * Prevents accidentally mixing two string IDs of different entity types.
 *
 * Example:
 *   type UserId   = Brand<string, "UserId">;
 *   type TenantId = Brand<string, "TenantId">;
 */
declare const __brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { readonly [__brand]: TBrand };

export type Branded<T, TBrand extends string> = Brand<T, TBrand>;

// ──────────────────────────────────────────────────────────────────
// RUNTIME HELPERS
// ──────────────────────────────────────────────────────────────────

/**
 * Type guard to check if a value is a branded type.
 * Note: This is a runtime check and only works if the brand is actually present.
 * In most cases, branded types are erased at runtime, so this guard may not work as expected.
 * Use this for cases where you need runtime validation of branded values.
 */
export function isBranded<T, B extends string>(
  value: unknown,
  brand: B
): value is Brand<T, B> {
  if (typeof value !== "object" || value === null) return false;
  return "__brand" in value && (value as any).__brand === brand;
}

/**
 * Create a branded value from a raw value (runtime).
 * Use with caution - this bypasses compile-time safety.
 * This is useful when you need to create branded values from external sources (e.g., database, API).
 */
export function createBrand<T, B extends string>(
  value: T,
  brand: B
): Brand<T, B> {
  return value as Brand<T, B>;
}

/**
 * Factory utility for branded string types.
 * Provides helper methods for creating and validating branded strings.
 */
export const BrandedString = {
  /**
   * Create a branded string value.
   * Usage: const userId = BrandedString.create<UserId>("user-123");
   */
  create: <T extends Brand<string, any>>(value: string): T => {
    return value as T;
  },

  /**
   * Unwrap a branded string to its raw string value.
   * Usage: const rawId = BrandedString.unwrap(userId);
   */
  unwrap: <T extends Brand<string, any>>(value: T): string => {
    return value as string;
  },

  /**
   * Check if a value is a branded string of a specific brand.
   * Note: This is a runtime check and may not work as expected due to type erasure.
   */
  isValid: <T extends Brand<string, any>>(
    value: unknown,
    brand: string
  ): value is T => {
    return typeof value === "string" && (value as any).__brand === brand;
  },
};
