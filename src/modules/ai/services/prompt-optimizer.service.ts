import { aiCoreService } from '@modules/ai/services/ai-core.service';
import { AIFeature } from '@constants/index';

const OPTIMIZER_SYSTEM_PROMPT =
  'You are an expert prompt engineer. Rewrite the given prompt to be clearer, more specific, ' +
  'and more likely to produce a high-quality response from an LLM. Return only the optimized ' +
  'prompt text with no preamble or explanation.';

export class PromptOptimizerService {
  async optimize(userId: string, rawPrompt: string): Promise<{ optimizedPrompt: string }> {
    const result = await aiCoreService.completeTracked(
      {
        messages: [
          { role: 'system', content: OPTIMIZER_SYSTEM_PROMPT },
          { role: 'user', content: rawPrompt },
        ],
        temperature: 0.4,
      },
      { userId, feature: AIFeature.PROMPT_OPTIMIZER }
    );

    return { optimizedPrompt: result.content.trim() };
  }
}

export const promptOptimizerService = new PromptOptimizerService();
