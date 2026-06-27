import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface ITag extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  usageCount: number;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const tagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    slug: { type: String, required: true, lowercase: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    usageCount: { type: Number, default: 0 },
    aiGenerated: { type: Boolean, default: false },
  },
  baseSchemaOptions
);

tagSchema.index({ ownerId: 1, slug: 1 }, { unique: true });

applyBasePlugin(tagSchema);

export const TagModel = model<ITag>('Tag', tagSchema);
