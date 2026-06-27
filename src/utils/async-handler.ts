import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps an async Express handler so that rejected promises are passed to
 * next(), letting the global error handler deal with them, instead of
 * crashing the process via an unhandled rejection.
 */
export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
