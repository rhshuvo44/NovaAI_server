import { Schema, model, Document, Types } from 'mongoose';
import { NotificationType } from '@constants/index';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date | null;
  link?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), default: NotificationType.INFO },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    link: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  baseSchemaOptions
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

applyBasePlugin(notificationSchema);

export const NotificationModel = model<INotification>('Notification', notificationSchema);
