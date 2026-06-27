import { BaseRepository } from '@shared/models/base.repository';
import { NotificationModel, INotification } from '@modules/notifications/models/notification.model';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(NotificationModel);
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return this.model.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.model.updateMany(
      { userId, isRead: false, deletedAt: null },
      { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount;
  }

  async countUnread(userId: string): Promise<number> {
    return this.model.countDocuments({ userId, isRead: false, deletedAt: null });
  }
}

export const notificationRepository = new NotificationRepository();
