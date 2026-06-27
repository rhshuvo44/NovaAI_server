import { Types } from 'mongoose';
import { aiCoreService } from '@modules/ai/services/ai-core.service';
import { AIFeature } from '@constants/index';
import { AIError } from '@shared/errors';
import { DocumentModel } from '@modules/documents/models/document.model';

export interface RecommendedDocument {
  documentId: string;
  title: string;
  reason: string;
}

export class RecommendationService {
  /**
   * Recommends documents to a user based on their own recent activity
   * (categories/tags they engage with), then uses the AI provider to write
   * a short human-readable reason for each suggestion.
   */
  async recommendDocuments(userId: string, limit = 5): Promise<RecommendedDocument[]> {
    const recentDocs = await DocumentModel.find({
      ownerId: new Types.ObjectId(userId),
      deletedAt: null,
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title categoryId tags')
      .lean();

    if (recentDocs.length === 0) {
      return [];
    }

    const categoryIds = [
      ...new Set(recentDocs.map((d) => d.categoryId?.toString()).filter(Boolean)),
    ];
    const tagIds = [...new Set(recentDocs.flatMap((d) => d.tags.map((t) => t.toString())))];

    const candidates = await DocumentModel.find({
      ownerId: new Types.ObjectId(userId),
      deletedAt: null,
      _id: { $nin: recentDocs.map((d) => d._id) },
      $or: [{ categoryId: { $in: categoryIds } }, { tags: { $in: tagIds } }],
    })
      .limit(limit * 2)
      .select('title content')
      .lean();

    if (candidates.length === 0) {
      return [];
    }

    const topCandidates = candidates.slice(0, limit);

    const result = await aiCoreService.completeTracked(
      {
        messages: [
          {
            role: 'system',
            content:
              'For each document title given, write one short reason (max 15 words) explaining why it might ' +
              "be relevant to read next, based on the user's recent activity. Respond as a JSON array of strings, " +
              'one per document, in the same order. No other text.',
          },
          {
            role: 'user',
            content: topCandidates.map((c, i) => `${i + 1}. ${c.title}`).join('\n'),
          },
        ],
        temperature: 0.5,
      },
      { userId, feature: AIFeature.RECOMMENDATION }
    );

    const reasons = this.parseReasons(result.content, topCandidates.length);

    return topCandidates.map((doc, i) => ({
      documentId: doc._id.toString(),
      title: doc.title,
      reason: reasons[i] ?? 'Related to your recent activity',
    }));
  }

  private parseReasons(raw: string, expectedCount: number): string[] {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '');
    try {
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      return parsed.filter((r): r is string => typeof r === 'string').slice(0, expectedCount);
    } catch {
      throw new AIError('AI returned recommendations in an unexpected format');
    }
  }
}

export const recommendationService = new RecommendationService();
