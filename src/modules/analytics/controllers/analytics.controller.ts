import { Request, Response } from 'express';
import { analyticsService } from '@modules/analytics/services/analytics.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';

export const trackEvent = asyncHandler(async (req: Request, res: Response) => {
  await analyticsService.track({
    userId: req.user?.userId,
    eventName: req.body.eventName,
    category: req.body.category,
    properties: req.body.properties,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  ApiResponse.success(res, null, 'Event tracked successfully', 202);
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const daysBack = req.query.daysBack ? Number(req.query.daysBack) : 30;
  const summary = await analyticsService.getSummary(daysBack);
  ApiResponse.success(res, summary, 'Analytics summary fetched successfully');
});
