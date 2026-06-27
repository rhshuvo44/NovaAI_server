import { aiCoreService } from '@modules/ai/services/ai-core.service';
import { AIFeature } from '@constants/index';

export interface GenerateContentInput {
  topic: string;
  tone?: 'professional' | 'casual' | 'persuasive' | 'technical';
  length?: 'short' | 'medium' | 'long';
}

const LENGTH_GUIDANCE: Record<string, string> = {
  short: 'around 100 words',
  medium: 'around 300 words',
  long: 'around 600 words',
};

export class ContentGeneratorService {
  async generate(userId: string, input: GenerateContentInput): Promise<{ content: string }> {
    const tone = input.tone ?? 'professional';
    const length = LENGTH_GUIDANCE[input.length ?? 'medium'];

    const result = await aiCoreService.completeTracked(
      {
        messages: [
          {
            role: 'system',
            content: `You are a professional content writer. Write in a ${tone} tone, ${length}.`,
          },
          { role: 'user', content: `Write content about: ${input.topic}` },
        ],
        temperature: 0.8,
      },
      { userId, feature: AIFeature.CONTENT_GENERATOR }
    );

    return { content: result.content };
  }
}

export const contentGeneratorService = new ContentGeneratorService();
