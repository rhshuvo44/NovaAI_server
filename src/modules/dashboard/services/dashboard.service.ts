import { documentRepository } from '@modules/documents/repositories/document.repository';
import { chatRepository } from '@modules/chat/repositories/chat.repository';
import { notificationRepository } from '@modules/notifications/repositories/notification.repository';
import { aiUsageRepository } from '@modules/ai/repositories/ai-usage.repository';
import { promptRepository } from '@modules/prompts/repositories/prompt.repository';
import { cacheService } from '@shared/services/cache.service';
import { REDIS_KEY_PREFIX, CACHE_TTL } from '@constants/index';

export interface DashboardOverview {
  documentCount: number;
  archivedDocumentCount: number;
  activeChatCount: number;
  promptCount: number;
  unreadNotificationCount: number;
  aiTokensUsedThisMonth: number;
}

export class DashboardService {
  private overviewCacheKey(userId: string): string {
    return `${REDIS_KEY_PREFIX.DASHBOARD}overview:${userId}`;
  }

  async getOverview(userId: string): Promise<DashboardOverview> {
    return cacheService.getOrSet(
      this.overviewCacheKey(userId),
      async () => {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [
          documentCount,
          archivedDocumentCount,
          activeChatCount,
          promptCount,
          unreadNotificationCount,
          aiTokensUsedThisMonth,
        ] = await Promise.all([
          documentRepository.count({ ownerId: userId, isArchived: false }),
          documentRepository.count({ ownerId: userId, isArchived: true }),
          chatRepository.count({ userId, isArchived: false }),
          promptRepository.count({ ownerId: userId }),
          notificationRepository.countUnread(userId),
          aiUsageRepository.getTotalTokensForUser(userId, startOfMonth),
        ]);

        return {
          documentCount,
          archivedDocumentCount,
          activeChatCount,
          promptCount,
          unreadNotificationCount,
          aiTokensUsedThisMonth,
        };
      },
      CACHE_TTL.DASHBOARD
    );
  }

  async invalidateOverview(userId: string): Promise<void> {
    await cacheService.del(this.overviewCacheKey(userId));
  }
}

export const dashboardService = new DashboardService();
