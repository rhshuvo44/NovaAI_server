import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '@config/env';
import { ApiResponse } from '@shared/responses/api-response';

function rateLimitHandler(_req: Request, res: Response): void {
  ApiResponse.error(res, 'Too many requests, please try again later', 429, 'RATE_LIMIT_ERROR');
}

function userOrIpKeyGenerator(req: Request): string {
  if (req.user?.userId) return req.user.userId;
  return ipKeyGenerator(req.ip ?? '0.0.0.0');
}

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: userOrIpKeyGenerator,
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: userOrIpKeyGenerator,
});
