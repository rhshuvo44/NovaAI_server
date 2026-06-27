import { Request, Response } from 'express';
import { settingsService } from '@modules/settings/services/settings.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError, NotFoundError } from '@shared/errors';
import { getParam } from '@utils/get-param';

export const getSystemSetting = asyncHandler(async (req: Request, res: Response) => {
  const value = await settingsService.getSystemSetting(getParam(req, 'key'));
  if (value === null) throw new NotFoundError('Setting');
  ApiResponse.success(res, { key: getParam(req, 'key'), value }, 'Setting fetched successfully');
});

export const setSystemSetting = asyncHandler(async (req: Request, res: Response) => {
  const setting = await settingsService.setSystemSetting(getParam(req, 'key'), req.body.value);
  ApiResponse.success(res, setting, 'Setting updated successfully');
});

export const getUserSetting = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const value = await settingsService.getUserSetting(req.user.userId, getParam(req, 'key'));
  if (value === null) throw new NotFoundError('Setting');
  ApiResponse.success(res, { key: getParam(req, 'key'), value }, 'Setting fetched successfully');
});

export const setUserSetting = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const setting = await settingsService.setUserSetting(
    req.user.userId,
    getParam(req, 'key'),
    req.body.value
  );
  ApiResponse.success(res, setting, 'Setting updated successfully');
});

export const listUserSettings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const settings = await settingsService.listUserSettings(req.user.userId);
  ApiResponse.success(res, settings, 'Settings fetched successfully');
});
