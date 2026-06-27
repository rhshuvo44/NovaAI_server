import { Router } from 'express';
import * as analyticsController from '@modules/analytics/controllers/analytics.controller';
import {
  trackEventValidator,
  summaryQueryValidator,
} from '@modules/analytics/validators/analytics.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth, optionalAuth } from '@middlewares/auth.middleware';
import { requirePermissions } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';

const router = Router();

router.post(
  '/track',
  optionalAuth,
  trackEventValidator,
  handleValidationErrors,
  analyticsController.trackEvent
);

router.get(
  '/summary',
  requireAuth,
  requirePermissions(Permission.ANALYTICS_READ),
  summaryQueryValidator,
  handleValidationErrors,
  analyticsController.getSummary
);

export default router;
