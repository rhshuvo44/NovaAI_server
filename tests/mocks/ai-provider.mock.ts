import { AIProvider, AICompletionRequest, AICompletionResult } from '@modules/ai/interfaces/ai-provider.interface';

export class MockAIProvider implements AIProvider {
  public readonly name = 'openai' as const;
  public lastRequest: AICompletionRequest | null = null;
  public nextResponse: string = 'mock ai response';

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    this.lastRequest = request;
    return {
      content: this.nextResponse,
      promptTokens: 10,
      completionTokens: 10,
      totalTokens: 20,
      model: 'mock-model',
      provider: 'openai',
    };
  }
}

export const mockAIProvider = new MockAIProvider();
