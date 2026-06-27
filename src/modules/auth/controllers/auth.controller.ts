import { Request, Response } from 'express';
import { authService } from '@modules/auth/services/auth.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';

function getRequestMeta(req: Request): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

export const bootstrapSession = asyncHandler(async (req: Request, res: Response) => {
  const { sessionToken } = req.body as { sessionToken: string };
  const result = await authService.bootstrapSession(sessionToken, getRequestMeta(req));

  ApiResponse.success(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    'Session established successfully'
  );
});

export const refreshSession = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refreshSession(refreshToken, getRequestMeta(req));

  ApiResponse.success(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    'Session refreshed successfully'
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  await authService.logout(refreshToken);
  ApiResponse.success(res, null, 'Logged out successfully');
});

export const logoutAllSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  await authService.logoutAllSessions(req.user.userId);
  ApiResponse.success(res, null, 'All sessions logged out successfully');
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const user = await authService.getCurrentUser(req.user.userId);
  ApiResponse.success(res, user, 'Current user fetched successfully');
});
