import { Schema, model, Document, Types } from 'mongoose';
import { baseSchemaOptions, applyBasePlugin } from '@shared/models/base.plugin';

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedByTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String },
  },
  baseSchemaOptions
);

refreshTokenSchema.index({ userId: 1, revokedAt: 1 });

applyBasePlugin(refreshTokenSchema);

export const RefreshTokenModel = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
