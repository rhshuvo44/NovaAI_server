import { Types } from 'mongoose';
import { analyticsRepository } from '@modules/analytics/repositories/analytics.repository';
import { cacheService } from '@shared/services/cache.service';
import { CACHE_TTL } from '@constants/index';

export interface TrackEventInput {
  userId?: string;
  eventName: string;
  category: string;
  properties?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AnalyticsSummary {
  categoryBreakdown: { category: string; count: number }[];
  dailyTimeSeries: { date: string; count: number }[];
  rangeStart: string;
  rangeEnd: string;
}

export class AnalyticsService {
  /**
   * Records an event. This is intentionally fire-and-forget from the
   * caller's perspective - analytics tracking should never fail a request.
   */
  async track(input: TrackEventInput): Promise<void> {
    try {
      await analyticsRepository.create({
        userId: input.userId ? new Types.ObjectId(input.userId) : undefined,
        eventName: input.eventName,
        category: input.category,
        properties: input.properties ?? {},
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
    } catch {
      // analytics failures must never propagate to the user-facing request
    }
  }

  async getSummary(daysBack = 30): Promise<AnalyticsSummary> {
    const cacheKey = `analytics:summary:${daysBack}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const since = new Date();
        since.setDate(since.getDate() - daysBack);

        const [categoryBreakdown, dailyTimeSeries] = await Promise.all([
          analyticsRepository.getCategoryBreakdown(since),
          analyticsRepository.getDailyTimeSeries(since),
        ]);

        return {
          categoryBreakdown,
          dailyTimeSeries,
          rangeStart: since.toISOString(),
          rangeEnd: new Date().toISOString(),
        };
      },
      CACHE_TTL.ANALYTICS
    );
  }

  async getUserActivityCount(userId: string, daysBack?: number): Promise<number> {
    const since = daysBack
      ? (() => {
          const d = new Date();
          d.setDate(d.getDate() - daysBack);
          return d;
        })()
      : undefined;
    return analyticsRepository.getTotalEventsForUser(userId, since);
  }
}

export const analyticsService = new AnalyticsService();
