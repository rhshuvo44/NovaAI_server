import { Router } from 'express';
import * as userController from '@modules/users/controllers/user.controller';
import {
  userIdParamValidator,
  updateProfileValidator,
  changeRoleValidator,
} from '@modules/users/validators/user.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { requirePermissions, requireOwnershipOrPermission } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  requirePermissions(Permission.USER_READ),
  paginationValidator,
  handleValidationErrors,
  userController.listUsers
);

router.patch(
  '/me',
  updateProfileValidator,
  handleValidationErrors,
  userController.updateOwnProfile
);

router.get(
  '/:id',
  userIdParamValidator,
  handleValidationErrors,
  requireOwnershipOrPermission('id', Permission.USER_READ),
  userController.getUserById
);

router.patch(
  '/:id/role',
  requirePermissions(Permission.USER_WRITE),
  changeRoleValidator,
  handleValidationErrors,
  userController.changeUserRole
);

router.patch(
  '/:id/deactivate',
  requirePermissions(Permission.USER_WRITE),
  userIdParamValidator,
  handleValidationErrors,
  userController.deactivateUser
);

router.patch(
  '/:id/activate',
  requirePermissions(Permission.USER_WRITE),
  userIdParamValidator,
  handleValidationErrors,
  userController.activateUser
);

router.delete(
  '/:id',
  requirePermissions(Permission.USER_DELETE),
  userIdParamValidator,
  handleValidationErrors,
  userController.deleteUser
);

export default router;
