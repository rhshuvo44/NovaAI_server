import 'module-alias/register';
import http from 'http';
import { createApp } from '@app';
import { env } from '@config/env';
import { connectDatabase, disconnectDatabase } from '@config/database/mongoose';
import { logger } from '@utils/logger';

let server: http.Server;

async function bootstrap(): Promise<void> {
  const app = createApp();
  server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`${env.APP_NAME} API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`API docs available at ${env.APP_URL}/api-docs`);
  });

  connectDatabase()
    .then(() => logger.info('MongoDB connection established'))
    .catch((err) => {
      logger.error('MongoDB connection failed — server still running', {
        error: (err as Error).message,
      });
    });
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 15000);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');
    }

    await disconnectDatabase();

    clearTimeout(forceExitTimer);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: (error as Error).message });
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  // an uncaught exception leaves the process in an undefined state;
  // exit after attempting cleanup rather than continuing to serve traffic
  void gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
  void gracefulShutdown('unhandledRejection');
});

bootstrap().catch((error) => {
  logger.error('Failed to bootstrap application', { error: (error as Error).message });
  process.exit(1);
});
