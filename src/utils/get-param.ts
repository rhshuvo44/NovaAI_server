import { Request } from 'express';
import { ValidationError } from '@shared/errors';

/**
 * Express 5 types route params as `string | string[]` to account for
 * repeated wildcard segments. Our routes never use repeated params, so this
 * helper asserts a single string value and fails loudly if that assumption
 * is ever violated.
 */
export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) {
    throw new ValidationError(`Expected a single value for route parameter "${name}"`);
  }
  if (!value) {
    throw new ValidationError(`Missing required route parameter "${name}"`);
  }
  return value;
}
