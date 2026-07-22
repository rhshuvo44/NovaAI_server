import { Schema, model, Document, Types } from 'mongoose';
import { Role } from '@constants/index';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role: Role;
  roleId?: Types.ObjectId;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    passwordHash: { type: String, required: true },
    firstName: { type: String, trim: true, maxlength: 100 },
    lastName: { type: String, trim: true, maxlength: 100 },
    avatarUrl: { type: String, trim: true },
    role: { type: String, enum: Object.values(Role), default: Role.USER, index: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  baseSchemaOptions
);

userSchema.index({ email: 1, deletedAt: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });

applyBasePlugin(userSchema);

export const UserModel = model<IUser>('User', userSchema);
