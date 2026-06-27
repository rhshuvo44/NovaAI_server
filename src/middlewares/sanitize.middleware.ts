import { Request, Response, NextFunction } from 'express';

const MONGO_OPERATOR_PATTERN = /^\$/;

/**
 * Recursively strips keys that look like Mongo query operators (e.g. "$gt",
 * "$where") from request input, preventing NoSQL injection via operator
 * injection in body/query/params. Mutates and returns a sanitized copy.
 */
function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (MONGO_OPERATOR_PATTERN.test(key) || key.includes('.')) {
        continue; // drop dangerous keys entirely
      }
      result[key] = sanitizeValue(val);
    }
    return result;
  }

  return value;
}

/**
 * Express 5 makes `req.query` a getter-only accessor in some configurations,
 * so rather than reassigning req.body/req.query/req.params directly (which
 * can throw), we sanitize in place by mutating the existing object's keys.
 */
function sanitizeInPlace(
  target: Record<string, unknown>,
  transform: (value: unknown) => unknown = sanitizeValue
): void {
  const transformed = transform(target) as Record<string, unknown>;
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  Object.assign(target, transformed);
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeInPlace(req.body as Record<string, unknown>);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeInPlace(req.query as Record<string, unknown>);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeInPlace(req.params as Record<string, unknown>);
  }
  next();
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtmlString(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Recursively HTML-escapes string fields in request input. This is a basic
 * defense-in-depth layer; output encoding at render time remains the
 * primary XSS defense for any HTML-rendering consumer of this API.
 */
function escapeValue(value: unknown): unknown {
  if (typeof value === 'string') return escapeHtmlString(value);
  if (Array.isArray(value)) return value.map(escapeValue);
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = escapeValue(val);
    }
    return result;
  }
  return value;
}

export function xssProtection(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeInPlace(req.body as Record<string, unknown>, escapeValue);
  }
  next();
}
