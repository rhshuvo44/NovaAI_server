import { BaseRepository } from '@shared/models/base.repository';
import { AuditLogModel, IAuditLog } from '@modules/audit-logs/models/audit-log.model';

export class AuditLogRepository extends BaseRepository<IAuditLog> {
  constructor() {
    super(AuditLogModel, false);
  }
}

export const auditLogRepository = new AuditLogRepository();
