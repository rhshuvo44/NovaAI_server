import { Schema, model, Document, Types } from 'mongoose';
import { Role, Permission } from '@constants/index';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IRole extends Document {
  _id: Types.ObjectId;
  name: Role;
  displayName: string;
  description?: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, enum: Object.values(Role), required: true, unique: true },
    displayName: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
    permissions: [{ type: String, enum: Object.values(Permission) }],
    isSystemRole: { type: Boolean, default: false },
  },
  baseSchemaOptions
);

applyBasePlugin(roleSchema);

export const RoleModel = model<IRole>('Role', roleSchema);
