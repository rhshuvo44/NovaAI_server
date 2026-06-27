import { Request, Response, NextFunction } from 'express';
import { auditLogService } from '@modules/audit-logs/services/audit-log.service';
import { AuditAction } from '@modules/audit-logs/models/audit-log.model';

export function auditAction(action: AuditAction, resourceType: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      if (!req.user || res.statusCode >= 400) return;

      void auditLogService.record({
        actorId: req.user.userId,
        action,
        resourceType,
        resourceId: typeof req.params.id === 'string' ? req.params.id : undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    });
    next();
  };
}
