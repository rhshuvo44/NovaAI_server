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

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body as {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  };
  const result = await authService.register(
    email,
    password,
    firstName,
    lastName,
    getRequestMeta(req)
  );

  ApiResponse.success(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    'Registration successful'
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password, getRequestMeta(req));

  ApiResponse.success(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    'Login successful'
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
