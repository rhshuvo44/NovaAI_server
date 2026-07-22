import crypto from 'crypto';
import { Types } from 'mongoose';
import { getAIProvider } from '@modules/ai/providers/provider.factory';
import {
  AICompletionRequest,
  AICompletionResult,
  AIMessage,
} from '@modules/ai/interfaces/ai-provider.interface';
import { cacheService } from '@shared/services/cache.service';
import { aiUsageRepository } from '@modules/ai/repositories/ai-usage.repository';
import { CACHE_TTL, AIFeature } from '@constants/index';
import { aiLogger } from '@utils/logger';

export interface TrackedCompletionOptions {
  userId: string;
  feature: AIFeature;
  cache?: boolean;
}

export class AICoreService {
  private buildCacheKey(messages: AIMessage[], feature: AIFeature): string {
    const hash = crypto.createHash('sha256').update(JSON.stringify(messages)).digest('hex');
    return `ai:${feature}:${hash}`;
  }

  /**
   * Executes a completion with Redis caching (identical prompts within the
   * TTL window are served from cache) and persists usage stats for billing
   * and analytics, regardless of cache hit/miss.
   */
  async completeTracked(
    request: AICompletionRequest,
    options: TrackedCompletionOptions
  ): Promise<AICompletionResult & { cached: boolean }> {
    const provider = getAIProvider();
    const useCache = options.cache ?? true;
    const cacheKey = this.buildCacheKey(request.messages, options.feature);
    const startedAt = Date.now();

    if (useCache) {
      const cached = await cacheService.get<AICompletionResult>(cacheKey);
      if (cached) {
        await this.recordUsage(options, cached, Date.now() - startedAt, true, true);
        return { ...cached, cached: true };
      }
    }

    try {
      const result = await provider.complete(request);

      if (useCache) {
        await cacheService.set(cacheKey, result, CACHE_TTL.AI_RESPONSE);
      }

      await this.recordUsage(options, result, Date.now() - startedAt, true, false);
      return { ...result, cached: false };
    } catch (error) {
      await this.recordUsage(
        options,
        {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          model: 'unknown',
          provider: provider.name,
          content: '',
        },
        Date.now() - startedAt,
        false,
        false,
        (error as Error).message
      );
      throw error;
    }
  }

  private async recordUsage(
    options: TrackedCompletionOptions,
    result: AICompletionResult,
    latencyMs: number,
    success: boolean,
    cached: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await aiUsageRepository.create({
        userId: new Types.ObjectId(options.userId),
        feature: options.feature,
        provider: result.provider,
        aiModel: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        latencyMs,
        cached,
        success,
        errorMessage,
      });
    } catch (error) {
      // usage tracking must never break the actual AI request flow
      aiLogger.error('Failed to record AI usage', { error: (error as Error).message });
    }
  }
}

export const aiCoreService = new AICoreService();
