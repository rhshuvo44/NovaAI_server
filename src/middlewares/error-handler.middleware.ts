import { Request, Response, NextFunction } from 'express';
import { BaseError } from '@shared/errors';
import { ApiResponse } from '@shared/responses/api-response';
import { logger } from '@utils/logger';
import { isProduction } from '@config/env';

interface HttpErrorLike extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

/**
 * Recognizes common non-BaseError exceptions thrown by Express/body-parser
 * itself (e.g. payload too large, malformed JSON) and maps them to an
 * appropriate 4xx response instead of falling through to a generic 500.
 */
function mapKnownHttpError(
  err: HttpErrorLike
): { statusCode: number; message: string; errorCode: string } | null {
  if (err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413) {
    return {
      statusCode: 413,
      message: 'Request payload is too large',
      errorCode: 'PAYLOAD_TOO_LARGE',
    };
  }
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return {
      statusCode: 400,
      message: 'Malformed JSON in request body',
      errorCode: 'MALFORMED_JSON',
    };
  }
  return null;
}

/**
 * Must be registered last, after all routes. Express recognizes this as an
 * error-handling middleware by its four-argument signature.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof BaseError) {
    if (!err.isOperational) {
      logger.error('Non-operational error encountered', {
        message: err.message,
        stack: err.stack,
        path: req.path,
      });
    }

    ApiResponse.error(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      err.details,
      isProduction ? undefined : err.stack
    );
    return;
  }

  const knownHttpError = mapKnownHttpError(err as HttpErrorLike);
  if (knownHttpError) {
    ApiResponse.error(
      res,
      knownHttpError.message,
      knownHttpError.statusCode,
      knownHttpError.errorCode
    );
    return;
  }

  // Unrecognized errors are treated as unexpected 500s and logged loudly,
  // since they represent a programming error rather than an anticipated
  // business-logic failure.
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  ApiResponse.error(
    res,
    isProduction ? 'Internal server error' : err.message,
    500,
    'INTERNAL_SERVER_ERROR',
    undefined,
    isProduction ? undefined : err.stack
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponse.error(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
}
