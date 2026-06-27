import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import type { RedisReply } from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redisClient } from '@config/database/redis';
import { REDIS_KEY_PREFIX } from '@constants/index';
import { env } from '@config/env';
import { ApiResponse } from '@shared/responses/api-response';

function rateLimitHandler(_req: Request, res: Response): void {
  ApiResponse.error(res, 'Too many requests, please try again later', 429, 'RATE_LIMIT_ERROR');
}

function buildStore(prefix: string): RedisStore {
  return new RedisStore({
    sendCommand: async (...args: string[]): Promise<RedisReply> => {
      const [command, ...rest] = args;
      const result = await redisClient.call(command, ...rest);
      return result as RedisReply;
    },
    prefix: `${REDIS_KEY_PREFIX.RATE_LIMIT}${prefix}:`,
  });
}

/**
 * Keys rate-limit buckets by authenticated user id when available, falling
 * back to the request IP (normalized for IPv6 via express-rate-limit's
 * helper) for unauthenticated requests.
 */
function userOrIpKeyGenerator(req: Request): string {
  if (req.user?.userId) return req.user.userId;
  return ipKeyGenerator(req.ip ?? '0.0.0.0');
}

/**
 * General-purpose API rate limiter applied globally.
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('global'),
  handler: rateLimitHandler,
});

/**
 * Stricter limiter for authentication endpoints to slow down brute-force /
 * credential-stuffing attempts.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('auth'),
  handler: rateLimitHandler,
});

/**
 * AI endpoints are expensive (token cost + latency), so they get their own
 * tighter budget independent of general API traffic.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('ai'),
  handler: rateLimitHandler,
  keyGenerator: userOrIpKeyGenerator,
});

/**
 * Upload endpoints limiter - prevents storage abuse.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildStore('upload'),
  handler: rateLimitHandler,
  keyGenerator: userOrIpKeyGenerator,
});
