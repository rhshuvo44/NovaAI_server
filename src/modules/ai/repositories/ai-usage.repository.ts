import { BaseRepository } from '@shared/models/base.repository';
import { AIUsageModel, IAIUsage } from '@modules/ai/models/ai-usage.model';
import { Types } from 'mongoose';

export class AIUsageRepository extends BaseRepository<IAIUsage> {
  constructor() {
    super(AIUsageModel, false);
  }

  async getTotalTokensForUser(userId: string, since?: Date): Promise<number> {
    const match: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (since) match.createdAt = { $gte: since };

    const result = await this.model.aggregate<{ total: number }>([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$totalTokens' } } },
    ]);

    return result[0]?.total ?? 0;
  }
}

export const aiUsageRepository = new AIUsageRepository();
