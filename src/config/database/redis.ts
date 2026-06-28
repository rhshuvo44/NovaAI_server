import Redis, { RedisOptions } from 'ioredis';
import { env } from '@config/env';
import { logger } from '@utils/logger';

function buildRedisOptions(): RedisOptions {
  const options: RedisOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    db: env.REDIS_DB,
    maxRetriesPerRequest: null, // required for BullMQ compatibility
    retryStrategy: (times: number) => Math.min(times * 200, 3000),
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ETIMEDOUT'];
      return targetErrors.some((e) => err.message.includes(e));
    },
    enableReadyCheck: true,
    lazyConnect: false,
  };

  if (env.REDIS_PASSWORD) options.password = env.REDIS_PASSWORD;
  if (env.REDIS_USERNAME) options.username = env.REDIS_USERNAME;
  // if (env.REDIS_TLS) options.tls = {};

  return options;
}

class RedisManager {
  private static instance: RedisManager;
  public readonly client: Redis;
  public readonly publisher: Redis;
  public readonly subscriber: Redis;
  public readonly bullClient: Redis;
  private connected = false;

  private constructor() {
    const options = buildRedisOptions();

    this.client = new Redis(options);
    this.publisher = new Redis(options);
    this.subscriber = new Redis(options);
    this.bullClient = new Redis(options);

    this.registerEvents(this.client, 'main');
    this.registerEvents(this.publisher, 'publisher');
    this.registerEvents(this.subscriber, 'subscriber');
    this.registerEvents(this.bullClient, 'bullmq');
  }

  private registerEvents(client: Redis, label: string): void {
    client.on('connect', () => {
      this.connected = true;
      logger.info(`Redis [${label}] connected`);
    });
    client.on('error', (err) => {
      logger.error(`Redis [${label}] error`, { error: err.message });
    });
    client.on('close', () => {
      logger.warn(`Redis [${label}] connection closed`);
    });
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public isConnected(): boolean {
    return this.connected && this.client.status === 'ready';
  }

  public async disconnectAll(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.publisher.quit(),
      this.subscriber.quit(),
      this.bullClient.quit(),
    ]);
    this.connected = false;
    logger.info('All Redis connections closed gracefully');
  }

  public getBullMQConnectionOptions(): RedisOptions {
    return buildRedisOptions();
  }
}

export const redisManager = RedisManager.getInstance();
export const redisClient = redisManager.client;
