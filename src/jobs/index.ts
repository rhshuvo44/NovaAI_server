import { Worker } from 'bullmq';
import { createEmailWorker } from '@jobs/email.worker';
import { createNotificationWorker } from '@jobs/notification.worker';
import { createAIProcessingWorker } from '@jobs/ai-processing.worker';
import { createScheduledWorker, registerRecurringJobs } from '@jobs/scheduled.worker';
import { logger } from '@utils/logger';

let workers: Worker[] = [];

export async function startWorkers(): Promise<void> {
  workers = [
    createEmailWorker(),
    createNotificationWorker(),
    createAIProcessingWorker(),
    createScheduledWorker(),
  ];

  await registerRecurringJobs();
  logger.info(`Started ${workers.length} background workers and registered recurring jobs`);
}

export async function stopWorkers(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  logger.info('All background workers stopped gracefully');
}
