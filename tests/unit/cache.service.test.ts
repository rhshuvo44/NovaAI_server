import { cacheService } from '@shared/services/cache.service';

describe('CacheService', () => {
  it('returns null for a missing key', async () => {
    expect(await cacheService.get('missing-key')).toBeNull();
  });

  it('sets and retrieves a value', async () => {
    await cacheService.set('test-key', { foo: 'bar' }, 60);
    const value = await cacheService.get<{ foo: string }>('test-key');
    expect(value).toEqual({ foo: 'bar' });
  });

  it('deletes a key', async () => {
    await cacheService.set('to-delete', 'value', 60);
    await cacheService.del('to-delete');
    expect(await cacheService.get('to-delete')).toBeNull();
  });

  it('reports correct existence', async () => {
    await cacheService.set('exists-key', 'value', 60);
    expect(await cacheService.exists('exists-key')).toBe(true);
    expect(await cacheService.exists('does-not-exist')).toBe(false);
  });

  it('invalidates keys matching a pattern', async () => {
    await cacheService.set('pattern:a', 1, 60);
    await cacheService.set('pattern:b', 2, 60);
    await cacheService.set('other:c', 3, 60);

    const deletedCount = await cacheService.invalidatePattern('pattern:*');
    expect(deletedCount).toBe(2);
    expect(await cacheService.get('other:c')).toBe(3);
  });

  it('getOrSet only calls the loader once for repeated calls', async () => {
    const loader = jest.fn().mockResolvedValue('computed-value');
    const first = await cacheService.getOrSet('getorset-key', loader, 60);
    const second = await cacheService.getOrSet('getorset-key', loader, 60);

    expect(first).toBe('computed-value');
    expect(second).toBe('computed-value');
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('increment increases the counter and applies TTL on first increment', async () => {
    const first = await cacheService.increment('counter-key', 60);
    const second = await cacheService.increment('counter-key', 60);
    expect(first).toBe(1);
    expect(second).toBe(2);

    const ttl = await cacheService.ttl('counter-key');
    expect(ttl).toBeGreaterThan(0);
  });
});
