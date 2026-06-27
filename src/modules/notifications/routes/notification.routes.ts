import { Router } from 'express';
import * as notificationController from '@modules/notifications/controllers/notification.controller';
import {
  notificationIdParamValidator,
  sendNotificationValidator,
} from '@modules/notifications/validators/notification.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { requirePermissions } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';

const router = Router();

router.use(requireAuth);

router.post(
  '/send',
  requirePermissions(Permission.USER_WRITE),
  sendNotificationValidator,
  handleValidationErrors,
  notificationController.sendNotification
);

router.get(
  '/',
  paginationValidator,
  handleValidationErrors,
  notificationController.listNotifications
);
router.get('/unread-count', notificationController.unreadCount);
router.patch(
  '/:id/read',
  notificationIdParamValidator,
  handleValidationErrors,
  notificationController.markAsRead
);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.delete(
  '/:id',
  notificationIdParamValidator,
  handleValidationErrors,
  notificationController.deleteNotification
);

export default router;
