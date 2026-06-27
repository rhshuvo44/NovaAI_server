import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError, ErrorDetail } from '@shared/errors';

export function handleValidationErrors(req: Request, _res: Response, next: NextFunction): void {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const details: ErrorDetail[] = result.array().map((err) => ({
    field: err.type === 'field' ? err.path : undefined,
    message: err.msg,
  }));

  next(new ValidationError('Request validation failed', details));
}
