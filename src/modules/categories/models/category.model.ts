import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parentId?: Types.ObjectId;
  icon?: string;
  color?: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 500 },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    icon: { type: String, trim: true },
    color: { type: String, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  baseSchemaOptions
);

applyBasePlugin(categorySchema);

export const CategoryModel = model<ICategory>('Category', categorySchema);
