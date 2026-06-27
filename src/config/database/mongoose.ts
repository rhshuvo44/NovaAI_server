import mongoose from 'mongoose';
import { env, isProduction } from '@config/env';
import { dbLogger } from '@utils/logger';

mongoose.set('strictQuery', true);

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    dbLogger.info('MongoDB connection already established');
    return;
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    dbLogger.info('MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    dbLogger.error('MongoDB connection error', { error: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    dbLogger.warn('MongoDB disconnected');
  });

  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        maxPoolSize: isProduction ? 50 : 10,
        minPoolSize: isProduction ? 10 : 2,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000,
        family: 4,
      });
      return;
    } catch (error) {
      attempt += 1;
      dbLogger.error(`MongoDB connection attempt ${attempt} failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (attempt >= maxRetries) {
        throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.connection.close();
  isConnected = false;
  dbLogger.info('MongoDB connection closed gracefully');
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getConnectionState(): string {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] ?? 'unknown';
}
