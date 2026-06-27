import { cacheService } from '@shared/services/cache.service';

describe('Performance: cache effectiveness', () => {
  it('serves repeated getOrSet calls from cache without re-invoking a slow loader', async () => {
    const slowLoader = jest.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { value: 'expensive-result' };
    });

    const start1 = Date.now();
    const first = await cacheService.getOrSet('perf:key', slowLoader, 60);
    const firstDuration = Date.now() - start1;

    const start2 = Date.now();
    const second = await cacheService.getOrSet('perf:key', slowLoader, 60);
    const secondDuration = Date.now() - start2;

    expect(first).toEqual(second);
    expect(slowLoader).toHaveBeenCalledTimes(1);
    // The cached call should be substantially faster than the uncached one.
    expect(secondDuration).toBeLessThan(firstDuration);
  });

  it('handles a burst of concurrent cache writes without error', async () => {
    const writes = Array.from({ length: 50 }, (_, i) => cacheService.set(`perf:burst:${i}`, i, 60));
    await expect(Promise.all(writes)).resolves.toBeDefined();

    const reads = await Promise.all(
      Array.from({ length: 50 }, (_, i) => cacheService.get<number>(`perf:burst:${i}`))
    );
    expect(reads).toEqual(Array.from({ length: 50 }, (_, i) => i));
  });
});
