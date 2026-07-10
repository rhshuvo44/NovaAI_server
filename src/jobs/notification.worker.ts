import { Worker, Job } from 'bullmq';
import { Types } from 'mongoose';
import { redisManager } from '@config/database/redis';
import { QueueName, NotificationType } from '@constants/index';
import { NotificationJobPayload, DeadLetterJobPayload } from '@queues/job-payloads';
import { notificationRepository } from '@modules/notifications/repositories/notification.repository';
import { pubSubService, PubSubChannel } from '@shared/services/pubsub.service';
import { deadLetterQueue } from '@queues/queue.factory';
import { logger } from '@utils/logger';

export function createNotificationWorker(): Worker<NotificationJobPayload> {
  const worker = new Worker<NotificationJobPayload>(
    QueueName.NOTIFICATION,
    async (job: Job<NotificationJobPayload>) => {
      const { userId, type, title, message, link, metadata } = job.data;

      const notification = await notificationRepository.create({
        userId: new Types.ObjectId(userId),
        type: (type as NotificationType) ?? NotificationType.INFO,
        title,
        message,
        link,
        metadata: metadata ?? {},
      });

      await pubSubService.publish(PubSubChannel.NOTIFICATION_CREATED, {
        userId,
        notification: notification.toJSON(),
      });
    },
    { connection: redisManager.getBullClient() as any, concurrency: 10 }
  );

  worker.on('completed', (job) => {
    logger.info('Notification job completed', { jobId: job.id, userId: job.data.userId });
  });

  worker.on('failed', async (job, error) => {
    logger.error('Notification job failed', { jobId: job?.id, error: error.message });

    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const payload: DeadLetterJobPayload = {
        originalQueue: QueueName.NOTIFICATION,
        originalJobId: job.id ?? 'unknown',
        failedReason: error.message,
        payload: job.data,
      };
      await deadLetterQueue.add('dead-letter', payload);
    }
  });

  return worker;
}
