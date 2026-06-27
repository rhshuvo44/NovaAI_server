export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly details?: ErrorDetail[];

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    isOperational = true,
    details?: ErrorDetail[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ApiError extends BaseError {
  constructor(message: string, statusCode = 500, errorCode = 'API_ERROR', details?: ErrorDetail[]) {
    super(message, statusCode, errorCode, true, details);
  }
}

export class ValidationError extends BaseError {
  constructor(message = 'Validation failed', details?: ErrorDetail[]) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', true);
  }
}

export class ConflictError extends BaseError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR', true);
  }
}

export class DatabaseError extends BaseError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR', true);
  }
}

export class RedisError extends BaseError {
  constructor(message = 'Cache operation failed') {
    super(message, 500, 'REDIS_ERROR', true);
  }
}

export class AIError extends BaseError {
  constructor(message = 'AI provider request failed') {
    super(message, 502, 'AI_ERROR', true);
  }
}

export class UploadError extends BaseError {
  constructor(message = 'File upload failed') {
    super(message, 400, 'UPLOAD_ERROR', true);
  }
}

export class RateLimitError extends BaseError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, 'RATE_LIMIT_ERROR', true);
  }
}

export class TooManyRequestsError extends RateLimitError {}

export class InternalServerError extends BaseError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false);
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE_ERROR', true);
  }
}

export class IdempotencyError extends BaseError {
  constructor(message = 'Duplicate request detected') {
    super(message, 409, 'IDEMPOTENCY_ERROR', true);
  }
}
