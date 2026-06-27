import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface ISettings extends Document {
  _id: Types.ObjectId;
  scope: 'system' | 'user';
  ownerId?: Types.ObjectId; // null for system scope
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const settingsSchema = new Schema<ISettings>(
  {
    scope: { type: String, enum: ['system', 'user'], required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    key: { type: String, required: true, index: true },
    value: { type: Schema.Types.Mixed },
  },
  baseSchemaOptions
);

settingsSchema.index({ scope: 1, ownerId: 1, key: 1 }, { unique: true });

applyBasePlugin(settingsSchema);

export const SettingsModel = model<ISettings>('Settings', settingsSchema);
