import { Schema, model, Document, Types } from 'mongoose';
import { UploadType } from '@constants/index';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IUpload extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  type: UploadType;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: 'cloudinary';
  publicId: string;
  url: string;
  secureUrl: string;
  folder?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const uploadSchema = new Schema<IUpload>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(UploadType), required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storageProvider: { type: String, enum: ['cloudinary'], default: 'cloudinary' },
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    secureUrl: { type: String, required: true },
    folder: { type: String },
  },
  baseSchemaOptions
);

applyBasePlugin(uploadSchema);

export const UploadModel = model<IUpload>('Upload', uploadSchema);
