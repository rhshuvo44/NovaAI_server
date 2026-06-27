export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  provider: 'openai' | 'gemini';
}

/**
 * Every AI provider (OpenAI, Gemini, future providers) implements this
 * interface. Business logic in the AI module's services depends only on
 * this contract, never on a provider SDK directly - so swapping providers
 * means writing a new adapter, not touching feature code.
 */
export interface AIProvider {
  readonly name: 'openai' | 'gemini';
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
}
