/**
 * Platform Database
 * Export all database-related functionality
 */

export { PostgresDatabase, createPostgresDatabase, checkPostgresDatabaseHealth } from './database.js';
export type { DatabaseConfig, LockHandle } from './database.js';
export { SchemaIntrospector } from './introspection.js';
export { CatalogNormalizer } from './normalizer.js';
export { SchemaFingerprintCalculator } from './fingerprint.js';
export type { FingerprintResult } from './fingerprint.js';
export type { Catalog, Table, Column, Constraint, Index } from './introspection.js';
export { default as pg } from 'pg';
export * from './persistence/index.js';
export * from './types.js';
export { DrizzleUnitOfWork } from './unitOfWork/DrizzleUnitOfWork.js';
export { TransactionContext } from './unitOfWork/TransactionContext.js';
export type { IUnitOfWork } from '@workspace/platform/ports';
