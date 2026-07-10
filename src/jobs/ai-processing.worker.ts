import { Worker, Job } from 'bullmq';
import { redisManager } from '@config/database/redis';
import { QueueName, AIFeature } from '@constants/index';
import { AIProcessingJobPayload, DeadLetterJobPayload } from '@queues/job-payloads';
import { summarizerService } from '@modules/ai/services/summarizer.service';
import { tagsGeneratorService } from '@modules/ai/services/tags-generator.service';
import { deadLetterQueue } from '@queues/queue.factory';
import { logger } from '@utils/logger';

async function processJob(data: AIProcessingJobPayload): Promise<unknown> {
  switch (data.feature) {
    case AIFeature.SUMMARIZER:
      return summarizerService.summarize(data.userId, data.payload.text as string);
    case AIFeature.TAGS_GENERATOR:
      return tagsGeneratorService.generateTags(data.userId, data.payload.content as string);
    default:
      throw new Error(`Unsupported background AI feature: ${data.feature}`);
  }
}

export function createAIProcessingWorker(): Worker<AIProcessingJobPayload> {
  const worker = new Worker<AIProcessingJobPayload>(
    QueueName.AI_PROCESSING,
    async (job: Job<AIProcessingJobPayload>) => processJob(job.data),
    { connection: redisManager.getBullClient() as unknown as any, concurrency: 3 }
  );

  worker.on('completed', (job) => {
    logger.info('AI processing job completed', { jobId: job.id, feature: job.data.feature });
  });

  worker.on('failed', async (job, error) => {
    logger.error('AI processing job failed', { jobId: job?.id, error: error.message });

    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const payload: DeadLetterJobPayload = {
        originalQueue: QueueName.AI_PROCESSING,
        originalJobId: job.id ?? 'unknown',
        failedReason: error.message,
        payload: job.data,
      };
      await deadLetterQueue.add('dead-letter', payload);
    }
  });

  return worker;
}
