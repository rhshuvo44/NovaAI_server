import { CACHE_TTL } from '@constants/index';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.interval = setInterval(() => this.evictExpired(), 60_000);
    this.interval.unref();
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = CACHE_TTL.MEDIUM): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    for (const k of keys) {
      this.store.delete(k);
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    let deletedCount = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    const remaining = Math.floor((entry.expiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      this.store.delete(key);
      return -2;
    }
    return remaining;
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const entry = this.store.get(key) as CacheEntry<number> | undefined;
    let value = entry?.value ?? 0;
    value++;
    const expiresAt = ttlSeconds
      ? Date.now() + ttlSeconds * 1000
      : (entry?.expiresAt ?? Date.now() + 86400000);
    this.store.set(key, { value, expiresAt });
    return value;
  }

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
