import crypto from 'crypto';
import { redisClient } from '@config/database/redis';
import { REDIS_KEY_PREFIX, CACHE_TTL } from '@constants/index';
import { logger } from '@utils/logger';
import { RedisError } from '@shared/errors';

export class TokenCacheService {
  private generateOtp(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i += 1) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }
    return otp;
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createOtp(identifier: string): Promise<string> {
    const otp = this.generateOtp();
    const key = `${REDIS_KEY_PREFIX.OTP}${identifier}`;
    try {
      await redisClient.set(key, otp, 'EX', CACHE_TTL.OTP);
      return otp;
    } catch (error) {
      logger.error('Failed to create OTP', { identifier, error: (error as Error).message });
      throw new RedisError('Failed to generate OTP');
    }
  }

  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const key = `${REDIS_KEY_PREFIX.OTP}${identifier}`;
    try {
      const stored = await redisClient.get(key);
      if (!stored || stored !== otp) return false;
      await redisClient.del(key); // one-time use
      return true;
    } catch (error) {
      logger.error('Failed to verify OTP', { identifier, error: (error as Error).message });
      return false;
    }
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateSecureToken();
    const key = `${REDIS_KEY_PREFIX.EMAIL_VERIFY}${token}`;
    await redisClient.set(key, userId, 'EX', CACHE_TTL.EMAIL_VERIFICATION);
    return token;
  }

  async consumeEmailVerificationToken(token: string): Promise<string | null> {
    const key = `${REDIS_KEY_PREFIX.EMAIL_VERIFY}${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return null;
    await redisClient.del(key);
    return userId;
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateSecureToken();
    const key = `${REDIS_KEY_PREFIX.PASSWORD_RESET}${token}`;
    await redisClient.set(key, userId, 'EX', CACHE_TTL.PASSWORD_RESET);
    return token;
  }

  async consumePasswordResetToken(token: string): Promise<string | null> {
    const key = `${REDIS_KEY_PREFIX.PASSWORD_RESET}${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return null;
    await redisClient.del(key);
    return userId;
  }
}

export const tokenCacheService = new TokenCacheService();
