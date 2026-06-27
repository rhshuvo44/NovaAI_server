import { Queue, QueueOptions } from 'bullmq';
import { redisManager } from '@config/database/redis';
import { QueueName } from '@constants/index';

const defaultQueueOptions: QueueOptions = {
  connection: redisManager.getBullMQConnectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 60 * 60 * 24, count: 1000 }, // keep 24h / last 1000
    removeOnFail: { age: 60 * 60 * 24 * 7 }, // keep failures for 7 days for inspection
  },
};

const queueRegistry = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  const existing = queueRegistry.get(name);
  if (existing) return existing;

  const queue = new Queue(name, defaultQueueOptions);
  queueRegistry.set(name, queue);
  return queue;
}

export const emailQueue = getQueue(QueueName.EMAIL);
export const notificationQueue = getQueue(QueueName.NOTIFICATION);
export const aiProcessingQueue = getQueue(QueueName.AI_PROCESSING);
export const scheduledQueue = getQueue(QueueName.SCHEDULED);
export const deadLetterQueue = getQueue(QueueName.DEAD_LETTER);

export async function closeAllQueues(): Promise<void> {
  await Promise.all([...queueRegistry.values()].map((q) => q.close()));
}
