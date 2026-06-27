import { Types } from 'mongoose';
import { BaseRepository } from '@shared/models/base.repository';
import {
  AnalyticsEventModel,
  IAnalyticsEvent,
} from '@modules/analytics/models/analytics-event.model';

export interface CategoryBreakdown {
  category: string;
  count: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export class AnalyticsRepository extends BaseRepository<IAnalyticsEvent> {
  constructor() {
    super(AnalyticsEventModel, false);
  }

  async getCategoryBreakdown(since: Date): Promise<CategoryBreakdown[]> {
    const results = await this.model.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return results.map((r) => ({ category: r._id, count: r.count }));
  }

  async getDailyTimeSeries(since: Date, eventName?: string): Promise<TimeSeriesPoint[]> {
    const match: Record<string, unknown> = { createdAt: { $gte: since } };
    if (eventName) match.eventName = eventName;

    const results = await this.model.aggregate<{ _id: string; count: number }>([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return results.map((r) => ({ date: r._id, count: r.count }));
  }

  async getTotalEventsForUser(userId: string, since?: Date): Promise<number> {
    const match: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (since) match.createdAt = { $gte: since };
    return this.model.countDocuments(match);
  }
}

export const analyticsRepository = new AnalyticsRepository();
