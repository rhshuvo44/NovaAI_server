import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export enum FavoriteEntityType {
  DOCUMENT = 'document',
  PROMPT = 'prompt',
  CHAT = 'chat',
}

export interface IFavorite extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  entityType: FavoriteEntityType;
  entityId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entityType: { type: String, enum: Object.values(FavoriteEntityType), required: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  baseSchemaOptions
);

favoriteSchema.index({ userId: 1, entityType: 1, entityId: 1 }, { unique: true });

applyBasePlugin(favoriteSchema);

export const FavoriteModel = model<IFavorite>('Favorite', favoriteSchema);
