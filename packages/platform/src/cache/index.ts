export * from './Cache.js';
export * from './RedisCache.js';
export { MemoryCache } from './MemoryCache.js';
export { RedisCache } from './RedisCache.js';

export interface Cache<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;
  has(key: string): boolean;
  size(): number;
}
