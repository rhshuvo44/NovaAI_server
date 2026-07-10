import { Worker, Job } from 'bullmq';
import { redisManager } from '@config/database/redis';
import { QueueName } from '@constants/index';
import { ScheduledJobPayload } from '@queues/job-payloads';
import { logger } from '@utils/logger';
import { SystemLogModel, SystemLogLevel } from '@modules/system-logs/models/system-log.model';

async function processScheduledJob(data: ScheduledJobPayload): Promise<void> {
  switch (data.jobType) {
    case 'cleanup-expired-tokens':
      // RefreshToken TTL index handles actual expiry; this job exists as a
      // hook point for additional cleanup logic (e.g. audit log archival).
      logger.info('Ran scheduled cleanup-expired-tokens job');
      break;
    case 'system-health-snapshot':
      await SystemLogModel.create({
        level: SystemLogLevel.INFO,
        source: 'scheduled-job',
        message: 'Periodic health snapshot recorded',
        context: data.payload,
      });
      break;
    default:
      logger.warn('Unknown scheduled job type received', { jobType: data.jobType });
  }
}

export function createScheduledWorker(): Worker<ScheduledJobPayload> {
  const worker = new Worker<ScheduledJobPayload>(
    QueueName.SCHEDULED,
    async (job: Job<ScheduledJobPayload>) => processScheduledJob(job.data),
    { connection: redisManager.getBullClient() as any, concurrency: 2 }
  );

  worker.on('completed', (job) => {
    logger.info('Scheduled job completed', { jobId: job.id, jobType: job.data.jobType });
  });

  worker.on('failed', (job, error) => {
    logger.error('Scheduled job failed', { jobId: job?.id, error: error.message });
  });

  return worker;
}

/**
 * Registers recurring jobs using BullMQ's repeat options. Call once at
 * application startup.
 */
export async function registerRecurringJobs(): Promise<void> {
  const { scheduledQueue } = await import('@queues/queue.factory');

  await scheduledQueue.add(
    'cleanup-expired-tokens',
    { jobType: 'cleanup-expired-tokens', payload: {} },
    { repeat: { pattern: '0 3 * * *' } } // daily at 3am
  );

  await scheduledQueue.add(
    'system-health-snapshot',
    { jobType: 'system-health-snapshot', payload: {} },
    { repeat: { pattern: '*/15 * * * *' } } // every 15 minutes
  );
}
