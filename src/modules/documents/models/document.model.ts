import { Schema, model, Document as MongooseDocument, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IDocument extends MongooseDocument {
  _id: Types.ObjectId;
  title: string;
  content: string;
  ownerId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  tags: Types.ObjectId[];
  isPublic: boolean;
  isArchived: boolean;
  aiGenerated: boolean;
  aiSummary?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const documentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300, index: 'text' },
    content: { type: String, required: true, index: 'text' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    isPublic: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    aiGenerated: { type: Boolean, default: false },
    aiSummary: { type: String, maxlength: 2000 },
    version: { type: Number, default: 1 },
  },
  baseSchemaOptions
);

documentSchema.index({ ownerId: 1, isArchived: 1, createdAt: -1 });
documentSchema.index({ categoryId: 1, isPublic: 1 });

applyBasePlugin(documentSchema);

export const DocumentModel = model<IDocument>('Document', documentSchema);
