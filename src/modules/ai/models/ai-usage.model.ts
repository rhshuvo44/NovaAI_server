import { Schema, model, Document, Types } from 'mongoose';
import { AIFeature } from '@constants/index';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IAIUsage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  feature: AIFeature;
  provider: 'openai' | 'gemini';
  aiModel: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  cached: boolean;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const aiUsageSchema = new Schema<IAIUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, enum: Object.values(AIFeature), required: true, index: true },
    provider: { type: String, enum: ['openai', 'gemini'], required: true },
    aiModel: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    cached: { type: Boolean, default: false },
    success: { type: Boolean, default: true },
    errorMessage: { type: String },
  },
  baseSchemaOptions
);

aiUsageSchema.index({ userId: 1, createdAt: -1 });
aiUsageSchema.index({ feature: 1, createdAt: -1 });

applyBasePlugin(aiUsageSchema);

export const AIUsageModel = model<IAIUsage>('AIUsage', aiUsageSchema);
