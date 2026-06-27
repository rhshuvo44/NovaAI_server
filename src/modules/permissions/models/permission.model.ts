import { Schema, model, Document, Types } from 'mongoose';
import { Permission } from '@constants/index';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IPermission extends Document {
  _id: Types.ObjectId;
  key: Permission;
  displayName: string;
  description?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const permissionSchema = new Schema<IPermission>(
  {
    key: { type: String, enum: Object.values(Permission), required: true, unique: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    category: { type: String, required: true, trim: true, index: true },
  },
  baseSchemaOptions
);

applyBasePlugin(permissionSchema);

export const PermissionModel = model<IPermission>('Permission', permissionSchema);
