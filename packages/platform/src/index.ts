// Re-export from scoped packages for backward compatibility
export * from '@workspace/platform-logger';
export type { IUnitOfWork } from '@workspace/kernel';

// Platform-specific exports
export * from './errors/index.js';
export * from './security/index.js';
export * from './cache/index.js';
export * from './config/index.js';
export * from './observability/index.js';
export * from './scheduler/index.js';
export * from './storage/index.js';
export * from './email/index.js';
export {
  ValidationError as SchemaValidationError,
  ZodValidator,
  createZodSchemas,
} from './validation/index.js';
export type {
  ValidationFailure,
  ValidationResult,
  ValidationSuccess,
  Validator,
  InferZodSchemas,
  ZodSchemas,
} from './validation/index.js';
export * from './messaging/index.js';
export * from './presentation/index.js';
