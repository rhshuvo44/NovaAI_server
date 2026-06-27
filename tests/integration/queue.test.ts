import { Worker } from 'bullmq';
import { getQueue } from '@queues/queue.factory';
import { QueueName } from '@constants/index';
import { redisManager } from '@config/database/redis';

describe('Queue system', () => {
  it('processes a job end-to-end through a worker', async () => {
    const queue = getQueue(QueueName.SCHEDULED);
    const processed: unknown[] = [];

    const worker = new Worker(
      QueueName.SCHEDULED,
      async (job) => {
        processed.push(job.data);
      },
      { connection: redisManager.getBullMQConnectionOptions() }
    );

    await new Promise<void>((resolve) => worker.once('ready', () => resolve()));

    await queue.add('test-job', { hello: 'world' });

    await new Promise<void>((resolve) => {
      worker.on('completed', () => resolve());
    });

    expect(processed).toEqual([{ hello: 'world' }]);

    await worker.close();
  });

  it('retries a failing job according to configured attempts', async () => {
    const queue = getQueue(QueueName.AI_PROCESSING);
    let attemptCount = 0;

    const worker = new Worker(
      QueueName.AI_PROCESSING,
      async () => {
        attemptCount += 1;
        if (attemptCount < 2) {
          throw new Error('Simulated transient failure');
        }
      },
      { connection: redisManager.getBullMQConnectionOptions() }
    );

    await new Promise<void>((resolve) => worker.once('ready', () => resolve()));

    await queue.add('flaky-job', {}, { attempts: 3, backoff: { type: 'fixed', delay: 100 } });

    await new Promise<void>((resolve) => {
      worker.on('completed', () => resolve());
    });

    expect(attemptCount).toBe(2);

    await worker.close();
  });
});
