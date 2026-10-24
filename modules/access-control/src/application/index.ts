export { AssignRoleUseCase } from './use-cases/AssignRoleUseCase.js';
export { GrantPermissionUseCase } from './use-cases/GrantPermissionUseCase.js';
export { RevokePermissionUseCase } from './use-cases/RevokePermissionUseCase.js';
export { CheckPermissionUseCase } from './use-cases/CheckPermissionUseCase.js';
export type { ApplicationError } from './errors/ApplicationError.js';
export {
  ValidationApplicationError,
  NotFoundApplicationError,
  ConflictApplicationError,
  UnauthorizedApplicationError,
  InternalApplicationError,
} from './errors/ApplicationError.js';
