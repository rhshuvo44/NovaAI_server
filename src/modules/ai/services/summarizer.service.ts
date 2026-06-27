import { aiCoreService } from '@modules/ai/services/ai-core.service';
import { AIFeature } from '@constants/index';
import { ValidationError } from '@shared/errors';

const MAX_INPUT_LENGTH = 20000;

export class SummarizerService {
  async summarize(userId: string, text: string, maxSentences = 3): Promise<{ summary: string }> {
    if (text.length > MAX_INPUT_LENGTH) {
      throw new ValidationError(`Text exceeds maximum length of ${MAX_INPUT_LENGTH} characters`);
    }

    const result = await aiCoreService.completeTracked(
      {
        messages: [
          {
            role: 'system',
            content: `Summarize the given text in at most ${maxSentences} sentences. Be concise and capture the key points only.`,
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      },
      { userId, feature: AIFeature.SUMMARIZER }
    );

    return { summary: result.content.trim() };
  }
}

export const summarizerService = new SummarizerService();
