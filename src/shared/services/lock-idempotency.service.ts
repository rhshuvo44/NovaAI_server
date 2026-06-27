import crypto from 'crypto';
import { redisClient } from '@config/database/redis';
import { REDIS_KEY_PREFIX } from '@constants/index';
import { logger } from '@utils/logger';
import { IdempotencyError } from '@shared/errors';

/**
 * Distributed lock implementation using Redis SET NX with a unique token,
 * released safely via a Lua script (compare-and-delete) to avoid releasing
 * a lock acquired by a different holder after expiry.
 */
export class DistributedLockService {
  private readonly releaseScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  async acquire(resource: string, ttlMs = 10000): Promise<string | null> {
    const key = `${REDIS_KEY_PREFIX.LOCK}${resource}`;
    const token = crypto.randomBytes(16).toString('hex');

    try {
      const result = await redisClient.set(key, token, 'PX', ttlMs, 'NX');
      return result === 'OK' ? token : null;
    } catch (error) {
      logger.error('Failed to acquire distributed lock', {
        resource,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async release(resource: string, token: string): Promise<boolean> {
    const key = `${REDIS_KEY_PREFIX.LOCK}${resource}`;
    try {
      const result = await redisClient.eval(this.releaseScript, 1, key, token);
      return result === 1;
    } catch (error) {
      logger.error('Failed to release distributed lock', {
        resource,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Run a function while holding the lock; releases automatically afterward.
   * Returns null if the lock could not be acquired.
   */
  async withLock<T>(resource: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
    const token = await this.acquire(resource, ttlMs);
    if (!token) return null;

    try {
      return await fn();
    } finally {
      await this.release(resource, token);
    }
  }
}

/**
 * Idempotency service: ensures a request with a given idempotency key is
 * only processed once. Stores the response so repeated requests with the
 * same key return the original result instead of re-executing side effects.
 */
export class IdempotencyService {
  private readonly ttlSeconds = 60 * 60 * 24; // 24 hours

  async checkAndReserve(key: string): Promise<boolean> {
    const redisKey = `${REDIS_KEY_PREFIX.IDEMPOTENCY}${key}`;
    const result = await redisClient.set(redisKey, 'processing', 'EX', this.ttlSeconds, 'NX');
    return result === 'OK';
  }

  async storeResult<T>(key: string, result: T): Promise<void> {
    const redisKey = `${REDIS_KEY_PREFIX.IDEMPOTENCY}${key}`;
    await redisClient.set(redisKey, JSON.stringify(result), 'EX', this.ttlSeconds);
  }

  async getStoredResult<T>(key: string): Promise<T | null> {
    const redisKey = `${REDIS_KEY_PREFIX.IDEMPOTENCY}${key}`;
    const value = await redisClient.get(redisKey);
    if (!value || value === 'processing') return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async isProcessing(key: string): Promise<boolean> {
    const redisKey = `${REDIS_KEY_PREFIX.IDEMPOTENCY}${key}`;
    const value = await redisClient.get(redisKey);
    return value === 'processing';
  }
}

export function assertIdempotent(isNew: boolean, key: string): void {
  if (!isNew) {
    throw new IdempotencyError(`Request with idempotency key "${key}" is already being processed`);
  }
}

export const distributedLockService = new DistributedLockService();
export const idempotencyService = new IdempotencyService();
