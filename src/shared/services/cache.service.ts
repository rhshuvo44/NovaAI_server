import { redisClient } from '@config/database/redis';
import { logger } from '@utils/logger';
import { RedisError } from '@shared/errors';
import { CACHE_TTL } from '@constants/index';

export class CacheService {
  /**
   * Get a cached value and parse it as JSON.
   * Returns null if the key does not exist or on parse failure.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get failed', { key, error: (error as Error).message });
      return null; // cache failures should never break the request flow
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (error) {
      logger.error('Cache set failed', { key, error: (error as Error).message });
      // do not throw - caching is a performance optimization, not a correctness requirement
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length === 0) return;
      await redisClient.del(...keys);
    } catch (error) {
      logger.error('Cache delete failed', { key, error: (error as Error).message });
    }
  }

  /**
   * Invalidate all keys matching a glob pattern (e.g. "cache:documents:*").
   * Uses SCAN instead of KEYS to avoid blocking Redis on large datasets.
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let cursor = '0';
    let deletedCount = 0;

    try {
      do {
        const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redisClient.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');
      return deletedCount;
    } catch (error) {
      logger.error('Cache pattern invalidation failed', {
        pattern,
        error: (error as Error).message,
      });
      return deletedCount;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists check failed', { key, error: (error as Error).message });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error('Cache ttl check failed', { key, error: (error as Error).message });
      return -2;
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const value = await redisClient.incr(key);
      if (ttlSeconds && value === 1) {
        await redisClient.expire(key, ttlSeconds);
      }
      return value;
    } catch (error) {
      logger.error('Cache increment failed', { key, error: (error as Error).message });
      throw new RedisError('Failed to increment cache key');
    }
  }

  /**
   * Wrap-around helper: try cache first, fall back to the provided loader,
   * then populate the cache with the loaded value.
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await loader();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

export const cacheService = new CacheService();
