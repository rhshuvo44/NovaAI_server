import { Router } from 'express';
import * as settingsController from '@modules/settings/controllers/settings.controller';
import {
  settingKeyParamValidator,
  setSettingValidator,
} from '@modules/settings/validators/settings.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { requirePermissions } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';

const router = Router();

router.use(requireAuth);

router.get('/user', settingsController.listUserSettings);
router.get(
  '/user/:key',
  settingKeyParamValidator,
  handleValidationErrors,
  settingsController.getUserSetting
);
router.put(
  '/user/:key',
  setSettingValidator,
  handleValidationErrors,
  settingsController.setUserSetting
);

router.get(
  '/system/:key',
  settingKeyParamValidator,
  handleValidationErrors,
  settingsController.getSystemSetting
);
router.put(
  '/system/:key',
  requirePermissions(Permission.SETTINGS_MANAGE),
  setSettingValidator,
  handleValidationErrors,
  settingsController.setSystemSetting
);

export default router;
