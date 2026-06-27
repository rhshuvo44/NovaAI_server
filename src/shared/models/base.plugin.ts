import { Schema } from 'mongoose';

/**
 * Applies cross-cutting schema conventions used by every model:
 * - soft delete field
 * - clean toJSON (removes __v, transforms _id -> id is intentionally NOT done
 *   to keep API contracts consistent with _id across the codebase)
 */
export function applyBasePlugin(schema: Schema): void {
  if (!schema.path('deletedAt')) {
    schema.add({ deletedAt: { type: Date, default: null, index: true } });
  }

  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.__v;
      return ret;
    },
  });

  schema.set('toObject', { virtuals: true });
}

export const baseSchemaOptions = {
  timestamps: true,
} as const;
