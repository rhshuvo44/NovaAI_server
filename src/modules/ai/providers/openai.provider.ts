import OpenAI from 'openai';
import { env } from '@config/env';
import {
  AIProvider,
  AICompletionRequest,
  AICompletionResult,
} from '@modules/ai/interfaces/ai-provider.interface';
import { AIError } from '@shared/errors';
import { aiLogger } from '@utils/logger';

export class OpenAIProvider implements AIProvider {
  public readonly name = 'openai' as const;
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    try {
      const response = await this.client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1024,
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        throw new AIError('OpenAI returned an empty completion');
      }

      return {
        content: choice.message.content,
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
        model: response.model,
        provider: 'openai',
      };
    } catch (error) {
      aiLogger.error('OpenAI completion failed', { error: (error as Error).message });
      if (error instanceof AIError) throw error;
      throw new AIError('OpenAI request failed');
    }
  }
}
