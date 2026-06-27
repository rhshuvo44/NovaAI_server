import { Request, Response } from 'express';
import { dashboardService } from '@modules/dashboard/services/dashboard.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const overview = await dashboardService.getOverview(req.user.userId);
  ApiResponse.success(res, overview, 'Dashboard overview fetched successfully');
});
