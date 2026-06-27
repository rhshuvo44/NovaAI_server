import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IAnalyticsEvent extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  eventName: string;
  category: string;
  properties: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    eventName: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    properties: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  baseSchemaOptions
);

analyticsEventSchema.index({ category: 1, createdAt: -1 });
analyticsEventSchema.index({ userId: 1, createdAt: -1 });

applyBasePlugin(analyticsEventSchema);

export const AnalyticsEventModel = model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);
