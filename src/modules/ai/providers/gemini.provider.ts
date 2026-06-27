import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@config/env';
import {
  AIProvider,
  AICompletionRequest,
  AICompletionResult,
} from '@modules/ai/interfaces/ai-provider.interface';
import { AIError } from '@shared/errors';
import { aiLogger } from '@utils/logger';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini' as const;
  private readonly client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    try {
      const systemMessages = request.messages.filter((m) => m.role === 'system');
      const conversationMessages = request.messages.filter((m) => m.role !== 'system');

      const model = this.client.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: systemMessages.map((m) => m.content).join('\n') || undefined,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 1024,
        },
      });

      const contents = conversationMessages.map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: m.content }],
      }));

      const result = await model.generateContent({ contents });
      const text = result.response.text();

      if (!text) {
        throw new AIError('Gemini returned an empty completion');
      }

      const usage = result.response.usageMetadata;

      return {
        content: text,
        promptTokens: usage?.promptTokenCount ?? 0,
        completionTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
        model: env.GEMINI_MODEL,
        provider: 'gemini',
      };
    } catch (error) {
      aiLogger.error('Gemini completion failed', { error: (error as Error).message });
      if (error instanceof AIError) throw error;
      throw new AIError('Gemini request failed');
    }
  }
}
