import { Router } from 'express';
import * as permissionController from '@modules/permissions/controllers/permission.controller';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { requirePermissions } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermissions(Permission.PERMISSION_MANAGE),
  paginationValidator,
  handleValidationErrors,
  permissionController.listPermissions
);

export default router;
