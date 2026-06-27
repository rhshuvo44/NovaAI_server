import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '@modules/analytics/services/analytics.service';

/**
 * Tracks every request as an analytics event after the response is sent.
 * Runs asynchronously and never blocks or fails the actual request.
 */
export function trackRequest(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    void analyticsService.track({
      userId: req.user?.userId,
      eventName: `${req.method} ${req.route?.path ?? req.path}`,
      category: 'api_request',
      properties: { statusCode: res.statusCode },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });
  next();
}
