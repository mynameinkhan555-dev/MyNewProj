export abstract class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationApplicationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class ConflictApplicationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR');
  }
}

export class NotFoundApplicationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'NOT_FOUND_ERROR');
  }
}

export class InternalApplicationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'INTERNAL_ERROR');
  }
}

export class UnauthorizedApplicationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED_ERROR');
  }
}

export class ForbiddenApplicationError extends ApplicationError {
  constructor(message: string) {
    super(message, 'FORBIDDEN_ERROR');
  }
}
