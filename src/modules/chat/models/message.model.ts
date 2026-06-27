import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chatId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MessageRole;
  content: string;
  tokensUsed?: number;
  aiModel?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: Object.values(MessageRole), required: true },
    content: { type: String, required: true },
    tokensUsed: { type: Number },
    aiModel: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  baseSchemaOptions
);

messageSchema.index({ chatId: 1, createdAt: 1 });

applyBasePlugin(messageSchema);

export const MessageModel = model<IMessage>('Message', messageSchema);
