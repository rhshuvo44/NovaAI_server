import { Schema, model, Document, Types } from 'mongoose';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';

export enum SystemLogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface ISystemLog extends Document {
  _id: Types.ObjectId;
  level: SystemLogLevel;
  source: string;
  message: string;
  context?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const systemLogSchema = new Schema<ISystemLog>(
  {
    level: { type: String, enum: Object.values(SystemLogLevel), required: true, index: true },
    source: { type: String, required: true, index: true },
    message: { type: String, required: true },
    context: { type: Schema.Types.Mixed },
  },
  baseSchemaOptions
);

systemLogSchema.index({ level: 1, createdAt: -1 });
// TTL: auto-purge system logs after 30 days to bound collection growth
systemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

applyBasePlugin(systemLogSchema);

export const SystemLogModel = model<ISystemLog>('SystemLog', systemLogSchema);
