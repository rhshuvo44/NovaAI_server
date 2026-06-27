import { Router } from 'express';
import { query } from 'express-validator';
import * as auditLogController from '@modules/audit-logs/controllers/audit-log.controller';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { requirePermissions } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';

const router = Router();

const filterValidator = [
  query('resourceType').optional().isString(),
  query('actorId').optional().isMongoId(),
];

router.get(
  '/',
  requireAuth,
  requirePermissions(Permission.AUDIT_READ),
  filterValidator,
  paginationValidator,
  handleValidationErrors,
  auditLogController.listAuditLogs
);

export default router;
