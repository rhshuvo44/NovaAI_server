import { Request, Response } from 'express';
import { auditLogService } from '@modules/audit-logs/services/audit-log.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { parsePaginationQuery } from '@validators/pagination.validator';

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    resourceType: typeof req.query.resourceType === 'string' ? req.query.resourceType : undefined,
    actorId: typeof req.query.actorId === 'string' ? req.query.actorId : undefined,
  };
  const { items, meta } = await auditLogService.list(parsePaginationQuery(req), filters);
  ApiResponse.paginated(res, items, meta, 'Audit logs fetched successfully');
});
