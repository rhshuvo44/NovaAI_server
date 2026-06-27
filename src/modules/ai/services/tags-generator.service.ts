import { aiCoreService } from '@modules/ai/services/ai-core.service';
import { AIFeature } from '@constants/index';
import { AIError } from '@shared/errors';

const TAGS_SYSTEM_PROMPT =
  'You generate concise topical tags for content. Given the text, respond with ONLY a JSON array ' +
  'of 3 to 8 lowercase, single-or-two-word tag strings. No other text, no markdown formatting.';

export class TagsGeneratorService {
  async generateTags(userId: string, content: string): Promise<{ tags: string[] }> {
    const result = await aiCoreService.completeTracked(
      {
        messages: [
          { role: 'system', content: TAGS_SYSTEM_PROMPT },
          { role: 'user', content },
        ],
        temperature: 0.3,
      },
      { userId, feature: AIFeature.TAGS_GENERATOR }
    );

    const tags = this.parseTags(result.content);
    return { tags };
  }

  private parseTags(raw: string): string[] {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '');

    try {
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      return parsed
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.toLowerCase().trim())
        .slice(0, 8);
    } catch {
      throw new AIError('AI returned tags in an unexpected format');
    }
  }
}

export const tagsGeneratorService = new TagsGeneratorService();
