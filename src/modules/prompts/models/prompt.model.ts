import { Schema, model, Document, Types } from 'mongoose';
import { AIFeature } from '@constants/index';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IPrompt extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  title: string;
  content: string;
  feature: AIFeature;
  isPublic: boolean;
  isFavorite: boolean;
  usageCount: number;
  optimizedVersion?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const promptSchema = new Schema<IPrompt>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    feature: { type: String, enum: Object.values(AIFeature), default: AIFeature.CHAT },
    isPublic: { type: Boolean, default: false, index: true },
    isFavorite: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
    optimizedVersion: { type: String },
  },
  baseSchemaOptions
);

applyBasePlugin(promptSchema);

export const PromptModel = model<IPrompt>('Prompt', promptSchema);
