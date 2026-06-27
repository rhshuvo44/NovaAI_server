import { redisManager } from '@config/database/redis';
import { logger } from '@utils/logger';

export enum PubSubChannel {
  NOTIFICATION_CREATED = 'notification:created',
  DOCUMENT_UPDATED = 'document:updated',
  USER_STATUS_CHANGED = 'user:status_changed',
  CACHE_INVALIDATE = 'cache:invalidate',
  AI_JOB_COMPLETED = 'ai:job_completed',
}

type SubscriberHandler<T = unknown> = (payload: T) => void | Promise<void>;

export class PubSubService {
  private handlers = new Map<string, SubscriberHandler[]>();
  private listening = false;

  async publish<T>(channel: PubSubChannel | string, payload: T): Promise<void> {
    try {
      await redisManager.publisher.publish(channel, JSON.stringify(payload));
    } catch (error) {
      logger.error('Pub/Sub publish failed', { channel, error: (error as Error).message });
    }
  }

  async subscribe<T>(
    channel: PubSubChannel | string,
    handler: SubscriberHandler<T>
  ): Promise<void> {
    const existing = this.handlers.get(channel) ?? [];
    existing.push(handler as SubscriberHandler);
    this.handlers.set(channel, existing);

    await redisManager.subscriber.subscribe(channel);
    this.ensureListening();
  }

  private ensureListening(): void {
    if (this.listening) return;
    this.listening = true;

    redisManager.subscriber.on('message', (channel: string, message: string) => {
      const channelHandlers = this.handlers.get(channel);
      if (!channelHandlers) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(message);
      } catch {
        parsed = message;
      }

      channelHandlers.forEach((handler) => {
        try {
          void handler(parsed);
        } catch (error) {
          logger.error('Pub/Sub handler threw an error', {
            channel,
            error: (error as Error).message,
          });
        }
      });
    });
  }

  async unsubscribe(channel: PubSubChannel | string): Promise<void> {
    this.handlers.delete(channel);
    await redisManager.subscriber.unsubscribe(channel);
  }
}

export const pubSubService = new PubSubService();
