import { Types } from 'mongoose';
import { auditLogRepository } from '@modules/audit-logs/repositories/audit-log.repository';
import { IAuditLog, AuditAction } from '@modules/audit-logs/models/audit-log.model';
import { auditLogger } from '@utils/logger';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export interface RecordAuditInput {
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  /**
   * Records an audit entry. Failures here are logged but never thrown,
   * since audit logging must not block the underlying business operation
   * it is recording.
   */
  async record(input: RecordAuditInput): Promise<void> {
    try {
      await auditLogRepository.create({
        actorId: new Types.ObjectId(input.actorId),
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        changes: input.changes,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    } catch (error) {
      auditLogger.error('Failed to persist audit log entry', {
        error: (error as Error).message,
        input,
      });
    }
  }

  async list(
    pagination: PaginationQuery,
    filters: { resourceType?: string; actorId?: string } = {}
  ): Promise<PaginatedResult<IAuditLog>> {
    return auditLogRepository.paginate(filters, pagination, 'actorId');
  }
}

export const auditLogService = new AuditLogService();
