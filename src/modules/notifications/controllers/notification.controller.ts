import { Request, Response } from 'express';
import { notificationService } from '@modules/notifications/services/notification.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { getParam } from '@utils/get-param';

export const sendNotification = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.send(req.body);
  ApiResponse.success(res, null, 'Notification queued successfully', 202);
});

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { items, meta } = await notificationService.list(
    req.user.userId,
    parsePaginationQuery(req)
  );
  ApiResponse.paginated(res, items, meta, 'Notifications fetched successfully');
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const count = await notificationService.unreadCount(req.user.userId);
  ApiResponse.success(res, { count }, 'Unread count fetched successfully');
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const notification = await notificationService.markAsRead(getParam(req, 'id'), req.user.userId);
  ApiResponse.success(res, notification, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const count = await notificationService.markAllAsRead(req.user.userId);
  ApiResponse.success(res, { updatedCount: count }, 'All notifications marked as read');
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  await notificationService.delete(getParam(req, 'id'), req.user.userId);
  ApiResponse.noContent(res, 'Notification deleted successfully');
});
