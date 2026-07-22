import { Types } from 'mongoose';
import { notificationRepository } from '@modules/notifications/repositories/notification.repository';
import { INotification } from '@modules/notifications/models/notification.model';
import { NotificationType } from '@constants/index';
import { NotFoundError, AuthorizationError } from '@shared/errors';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export interface SendNotificationInput {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  async send(input: SendNotificationInput): Promise<void> {
    await notificationRepository.create({
      userId: new Types.ObjectId(input.userId),
      type: input.type ?? NotificationType.INFO,
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: input.metadata,
    });
  }

  async list(userId: string, pagination: PaginationQuery): Promise<PaginatedResult<INotification>> {
    return notificationRepository.paginate({ userId }, pagination);
  }

  async unreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  }

  async markAsRead(id: string, userId: string): Promise<INotification> {
    const notification = await notificationRepository.findByIdOrThrow(id);
    if (notification.userId.toString() !== userId) {
      throw new AuthorizationError('You do not have access to this notification');
    }
    const updated = await notificationRepository.markAsRead(id, userId);
    if (!updated) throw new NotFoundError('Notification');
    return updated;
  }

  async markAllAsRead(userId: string): Promise<number> {
    return notificationRepository.markAllAsRead(userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await notificationRepository.findByIdOrThrow(id);
    if (notification.userId.toString() !== userId) {
      throw new AuthorizationError('You do not have access to this notification');
    }
    await notificationRepository.deleteById(id);
  }
}

export const notificationService = new NotificationService();
