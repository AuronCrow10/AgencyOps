import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { aiAnalysisResultSchema } from './ai.schemas.js';
import type { AILeadInput, AIProvider, AIProviderResponse } from './ai.provider.js';

export class OpenAIProvider implements AIProvider {
  async analyzeLead(input: AILeadInput): Promise<AIProviderResponse> {
    const prompt = `
You are an operations analyst for an agency. Review the lead and return JSON only.

Schema:
{
  "summary": "string",
  "category": "sales_lead | support_request | partnership | spam | other",
  "priority": "low | medium | high | urgent",
  "leadScore": 0-100 integer,
  "sentiment": "negative | neutral | positive",
  "suggestedReply": "string",
  "recommendedNextStep": "string"
}

Lead:
${JSON.stringify(input, null, 2)}
`.trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You must return strict JSON that matches the requested schema.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new AppError('OpenAI request failed', 502, 'ai_provider_error');
    }

    const rawOutput = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
      usage?: { total_tokens?: number };
    };
    const content = rawOutput.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError('OpenAI response did not contain content', 502, 'ai_provider_error');
    }

    const parsedJson = JSON.parse(content) as unknown;
    const parsedOutput = aiAnalysisResultSchema.parse(parsedJson);

    return {
      provider: 'openai',
      model: env.OPENAI_MODEL,
      rawInput: input,
      rawOutput,
      parsedOutput,
      costEstimate: rawOutput.usage?.total_tokens ? rawOutput.usage.total_tokens / 1_000_000 : undefined
    };
  }
}
