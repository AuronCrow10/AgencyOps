import type { AILeadInput } from './ai.provider.js';
import { MockAIProvider } from './mock-ai.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { env } from '../config/env.js';

function createProvider() {
  return env.AI_PROVIDER === 'openai' ? new OpenAIProvider() : new MockAIProvider();
}

export class AIService {
  private readonly provider = createProvider();

  async analyzeLead(input: AILeadInput) {
    return this.provider.analyzeLead(input);
  }
}
