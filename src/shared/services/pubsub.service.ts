import { EventEmitter } from 'events';

export enum PubSubChannel {
  NOTIFICATION_CREATED = 'notification:created',
  DOCUMENT_UPDATED = 'document:updated',
  USER_STATUS_CHANGED = 'user:status_changed',
  CACHE_INVALIDATE = 'cache:invalidate',
  AI_JOB_COMPLETED = 'ai:job_completed',
}

type SubscriberHandler<T = unknown> = (payload: T) => void | Promise<void>;

class PubSubService extends EventEmitter {
  async publish<T>(channel: PubSubChannel | string, payload: T): Promise<void> {
    this.emit(channel, payload);
  }

  async subscribe<T>(
    channel: PubSubChannel | string,
    handler: SubscriberHandler<T>
  ): Promise<void> {
    this.on(channel, handler);
  }

  async unsubscribe(channel: PubSubChannel | string): Promise<void> {
    this.removeAllListeners(channel);
  }
}

export const pubSubService = new PubSubService();
