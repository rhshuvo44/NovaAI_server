import { Worker, Job } from 'bullmq';
import { redisManager } from '@config/database/redis';
import { QueueName } from '@constants/index';
import { EmailJobPayload, DeadLetterJobPayload } from '@queues/job-payloads';
import { emailService } from '@emails/email.service';
import { deadLetterQueue } from '@queues/queue.factory';
import { logger } from '@utils/logger';

export function createEmailWorker(): Worker<EmailJobPayload> {
  const worker = new Worker<EmailJobPayload>(
    QueueName.EMAIL,
    async (job: Job<EmailJobPayload>) => {
      await emailService.send(job.data);
    },
    { connection: redisManager.getBullClient() as any, concurrency: 5 }
  );

  worker.on('completed', (job) => {
    logger.info('Email job completed', { jobId: job.id, to: job.data.to });
  });

  worker.on('failed', async (job, error) => {
    logger.error('Email job failed', { jobId: job?.id, error: error.message });

    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const payload: DeadLetterJobPayload = {
        originalQueue: QueueName.EMAIL,
        originalJobId: job.id ?? 'unknown',
        failedReason: error.message,
        payload: job.data,
      };
      await deadLetterQueue.add('dead-letter', payload);
    }
  });

  return worker;
}
