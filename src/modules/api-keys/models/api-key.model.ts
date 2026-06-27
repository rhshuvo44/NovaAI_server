import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IApiKey extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true, index: true },
    scopes: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  baseSchemaOptions
);

applyBasePlugin(apiKeySchema);

export const ApiKeyModel = model<IApiKey>('ApiKey', apiKeySchema);
