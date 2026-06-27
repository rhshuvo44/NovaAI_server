import { Router } from 'express';
import * as roleController from '@modules/roles/controllers/role.controller';
import {
  createRoleValidator,
  updatePermissionsValidator,
  roleIdParamValidator,
} from '@modules/roles/validators/role.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { requirePermissions, requireAnyPermission } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  requirePermissions(Permission.ROLE_MANAGE),
  createRoleValidator,
  handleValidationErrors,
  roleController.createRole
);

router.get(
  '/',
  requirePermissions(Permission.ROLE_MANAGE),
  paginationValidator,
  handleValidationErrors,
  roleController.listRoles
);

router.get(
  '/:id',
  requirePermissions(Permission.ROLE_MANAGE),
  roleIdParamValidator,
  handleValidationErrors,
  roleController.getRole
);

router.patch(
  '/:id/permissions',
  requireAnyPermission(Permission.ROLE_MANAGE, Permission.PERMISSION_MANAGE),
  updatePermissionsValidator,
  handleValidationErrors,
  roleController.updatePermissions
);

router.delete(
  '/:id',
  requirePermissions(Permission.ROLE_MANAGE),
  roleIdParamValidator,
  handleValidationErrors,
  roleController.deleteRole
);

export default router;
