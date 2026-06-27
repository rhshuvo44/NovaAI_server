import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ROLE_CHANGE = 'role_change',
  PERMISSION_CHANGE = 'permission_change',
  SETTINGS_CHANGE = 'settings_change',
}

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String },
    changes: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  baseSchemaOptions
);

auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

applyBasePlugin(auditLogSchema);

export const AuditLogModel = model<IAuditLog>('AuditLog', auditLogSchema);
