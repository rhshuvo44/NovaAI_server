import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IChat extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  isArchived: boolean;
  lastMessageAt?: Date;
  messageCount: number;
  aiModel: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const chatSchema = new Schema<IChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200, default: 'New Chat' },
    isArchived: { type: Boolean, default: false, index: true },
    lastMessageAt: { type: Date },
    messageCount: { type: Number, default: 0 },
    aiModel: { type: String, default: 'gpt-4o-mini' },
  },
  baseSchemaOptions
);

chatSchema.index({ userId: 1, isArchived: 1, lastMessageAt: -1 });

applyBasePlugin(chatSchema);

export const ChatModel = model<IChat>('Chat', chatSchema);
