import { env } from '@config/env';
import { AIProvider } from '@modules/ai/interfaces/ai-provider.interface';
import { OpenAIProvider } from '@modules/ai/providers/openai.provider';
import { GeminiProvider } from '@modules/ai/providers/gemini.provider';

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  cachedProvider = env.AI_PROVIDER === 'gemini' ? new GeminiProvider() : new OpenAIProvider();
  return cachedProvider;
}

/**
 * Allows explicitly requesting a provider regardless of the default env
 * configuration - useful for A/B testing or per-request provider override.
 */
export function getAIProviderByName(name: 'openai' | 'gemini'): AIProvider {
  return name === 'gemini' ? new GeminiProvider() : new OpenAIProvider();
}
