import crypto from 'crypto';
import { Schema, model, Document, Types } from 'mongoose';
import { logger } from '@utils/logger';
import { IdempotencyError } from '@shared/errors';

interface ILock extends Document {
  _id: Types.ObjectId;
  resource: string;
  token: string;
  expiresAt: Date;
}

const lockSchema = new Schema<ILock>({
  resource: { type: String, required: true, unique: true, index: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

const LockModel = model<ILock>('Lock', lockSchema);

interface IIdempotencyRecord extends Document {
  _id: Types.ObjectId;
  key: string;
  status: 'processing' | 'completed';
  result?: string;
  expiresAt: Date;
}

const idempotencySchema = new Schema<IIdempotencyRecord>({
  key: { type: String, required: true, unique: true, index: true },
  status: { type: String, required: true, enum: ['processing', 'completed'] },
  result: { type: String },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

const IdempotencyModel = model<IIdempotencyRecord>('IdempotencyRecord', idempotencySchema);

export class DistributedLockService {
  async acquire(resource: string, ttlMs = 10000): Promise<string | null> {
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + ttlMs);

    try {
      await LockModel.create({ resource, token, expiresAt });
      return token;
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) return null;
      logger.error('Failed to acquire lock', { resource, error: (error as Error).message });
      return null;
    }
  }

  async release(resource: string, token: string): Promise<boolean> {
    const result = await LockModel.deleteOne({ resource, token });
    return result.deletedCount > 0;
  }

  async withLock<T>(resource: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
    const token = await this.acquire(resource, ttlMs);
    if (!token) return null;
    try {
      return await fn();
    } finally {
      await this.release(resource, token);
    }
  }
}

export class IdempotencyService {
  private readonly ttlSeconds = 60 * 60 * 24;

  async checkAndReserve(key: string): Promise<boolean> {
    try {
      await IdempotencyModel.create({
        key,
        status: 'processing',
        expiresAt: new Date(Date.now() + this.ttlSeconds * 1000),
      });
      return true;
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) return false;
      throw error;
    }
  }

  async storeResult<T>(key: string, result: T): Promise<void> {
    await IdempotencyModel.updateOne(
      { key },
      { status: 'completed', result: JSON.stringify(result) }
    );
  }

  async getStoredResult<T>(key: string): Promise<T | null> {
    const doc = await IdempotencyModel.findOne({ key, status: 'completed' });
    if (!doc?.result) return null;
    try {
      return JSON.parse(doc.result) as T;
    } catch {
      return null;
    }
  }

  async isProcessing(key: string): Promise<boolean> {
    const doc = await IdempotencyModel.findOne({ key, status: 'processing' });
    return doc !== null;
  }
}

export function assertIdempotent(isNew: boolean, key: string): void {
  if (!isNew) {
    throw new IdempotencyError(`Request with idempotency key "${key}" is already being processed`);
  }
}

export const distributedLockService = new DistributedLockService();
export const idempotencyService = new IdempotencyService();
