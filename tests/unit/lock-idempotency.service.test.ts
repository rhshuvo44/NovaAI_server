import { distributedLockService, idempotencyService } from '@shared/services/lock-idempotency.service';

describe('DistributedLockService', () => {
  it('acquires a lock when free', async () => {
    const token = await distributedLockService.acquire('resource-a', 5000);
    expect(token).not.toBeNull();
  });

  it('fails to acquire a lock that is already held', async () => {
    const token1 = await distributedLockService.acquire('resource-b', 5000);
    expect(token1).not.toBeNull();

    const token2 = await distributedLockService.acquire('resource-b', 5000);
    expect(token2).toBeNull();
  });

  it('allows acquiring again after release', async () => {
    const token1 = await distributedLockService.acquire('resource-c', 5000);
    expect(token1).not.toBeNull();

    await distributedLockService.release('resource-c', token1 as string);

    const token2 = await distributedLockService.acquire('resource-c', 5000);
    expect(token2).not.toBeNull();
  });

  it('does not release a lock with the wrong token (prevents releasing someone else\'s lock)', async () => {
    const token1 = await distributedLockService.acquire('resource-d', 5000);
    expect(token1).not.toBeNull();

    const released = await distributedLockService.release('resource-d', 'wrong-token');
    expect(released).toBe(false);

    // the real lock should still be held
    const token2 = await distributedLockService.acquire('resource-d', 5000);
    expect(token2).toBeNull();
  });

  it('withLock executes the callback and releases automatically', async () => {
    const result = await distributedLockService.withLock('resource-e', 5000, async () => 'done');
    expect(result).toBe('done');

    // lock should be released, so a fresh acquire should succeed
    const token = await distributedLockService.acquire('resource-e', 5000);
    expect(token).not.toBeNull();
  });

  it('withLock returns null when the lock cannot be acquired', async () => {
    await distributedLockService.acquire('resource-f', 5000);
    const result = await distributedLockService.withLock('resource-f', 5000, async () => 'should-not-run');
    expect(result).toBeNull();
  });
});

describe('IdempotencyService', () => {
  it('allows the first reservation for a key', async () => {
    const isNew = await idempotencyService.checkAndReserve('idem-key-1');
    expect(isNew).toBe(true);
  });

  it('rejects a duplicate reservation for the same key', async () => {
    await idempotencyService.checkAndReserve('idem-key-2');
    const isNewAgain = await idempotencyService.checkAndReserve('idem-key-2');
    expect(isNewAgain).toBe(false);
  });

  it('stores and retrieves the result for a completed idempotent operation', async () => {
    await idempotencyService.checkAndReserve('idem-key-3');
    await idempotencyService.storeResult('idem-key-3', { status: 'success', id: 42 });

    const result = await idempotencyService.getStoredResult<{ status: string; id: number }>('idem-key-3');
    expect(result).toEqual({ status: 'success', id: 42 });
  });

  it('reports isProcessing correctly before a result is stored', async () => {
    await idempotencyService.checkAndReserve('idem-key-4');
    expect(await idempotencyService.isProcessing('idem-key-4')).toBe(true);

    await idempotencyService.storeResult('idem-key-4', { done: true });
    expect(await idempotencyService.isProcessing('idem-key-4')).toBe(false);
  });
});
