import crypto from 'crypto';
import { Schema, model, Document, Types } from 'mongoose';

interface ITokenStore extends Document {
  _id: Types.ObjectId;
  type: 'otp' | 'email_verify' | 'password_reset';
  identifier: string;
  token: string;
  payload?: string;
  expiresAt: Date;
}

const tokenStoreSchema = new Schema<ITokenStore>({
  type: { type: String, required: true, index: true },
  identifier: { type: String, required: true },
  token: { type: String, required: true, index: true },
  payload: { type: String },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

const TokenStoreModel = model<ITokenStore>('TokenStore', tokenStoreSchema);

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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await TokenStoreModel.create({
      type: 'otp',
      identifier,
      token: otp,
      expiresAt,
    });
    return otp;
  }

  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const doc = await TokenStoreModel.findOneAndDelete({
      type: 'otp',
      identifier,
      token: otp,
      expiresAt: { $gt: new Date() },
    });
    return doc !== null;
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await TokenStoreModel.create({
      type: 'email_verify',
      identifier: userId,
      token,
      payload: userId,
      expiresAt,
    });
    return token;
  }

  async consumeEmailVerificationToken(token: string): Promise<string | null> {
    const doc = await TokenStoreModel.findOneAndDelete({
      type: 'email_verify',
      token,
      expiresAt: { $gt: new Date() },
    });
    return doc?.payload ?? null;
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await TokenStoreModel.create({
      type: 'password_reset',
      identifier: userId,
      token,
      payload: userId,
      expiresAt,
    });
    return token;
  }

  async consumePasswordResetToken(token: string): Promise<string | null> {
    const doc = await TokenStoreModel.findOneAndDelete({
      type: 'password_reset',
      token,
      expiresAt: { $gt: new Date() },
    });
    return doc?.payload ?? null;
  }
}

export const tokenCacheService = new TokenCacheService();
