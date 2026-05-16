import { aiAnalysisResultSchema } from './ai.schemas.js';
import type { AILeadInput, AIProvider, AIProviderResponse } from './ai.provider.js';

export class MockAIProvider implements AIProvider {
  analyzeLead(input: AILeadInput): Promise<AIProviderResponse> {
    const text = `${input.serviceNeeded} ${input.message}`.toLowerCase();
    const spam = /instant|guaranteed|1 million|seo blast|crypto doubling/.test(text);
    const support = /support|urgent|broken|failing|incident/.test(text);
    const partnership = /partner|partnership|collaboration/.test(text);

    const category = spam
      ? 'spam'
      : support
        ? 'support_request'
        : partnership
          ? 'partnership'
          : 'sales_lead';
    const priority = spam
      ? 'low'
      : support || /urgent|48 hours|asap/.test(text)
        ? 'urgent'
        : /\$40k|\$50k|enterprise|automation|mvp/.test(text)
          ? 'high'
          : 'medium';
    const leadScore = spam ? 5 : priority === 'urgent' ? 76 : priority === 'high' ? 85 : 67;
    const sentiment = spam ? 'negative' : support ? 'negative' : 'positive';

    const parsedOutput = aiAnalysisResultSchema.parse({
      summary: `${input.company} is requesting ${input.serviceNeeded} with a stated budget of ${input.budgetRange}.`,
      category,
      priority,
      leadScore,
      sentiment,
      suggestedReply: spam
        ? 'We are unable to assist with this request.'
        : `Thanks ${input.name.split(' ')[0]}, we reviewed your request and can propose next steps after a discovery call.`,
      recommendedNextStep: spam
        ? 'Flag the lead as spam and avoid further follow-up.'
        : support
          ? 'Escalate to an operator and book a same-day response.'
          : 'Schedule a qualification call and prepare a scoped estimate.'
    });

    return Promise.resolve({
      provider: 'mock',
      model: 'mock-v1',
      rawInput: input,
      rawOutput: parsedOutput,
      parsedOutput,
      costEstimate: 0
    });
  }
}
