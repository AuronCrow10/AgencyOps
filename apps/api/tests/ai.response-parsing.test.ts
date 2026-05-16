import { describe, expect, it } from 'vitest';
import { aiAnalysisResultSchema } from '../src/ai/ai.schemas.js';

describe('AI response parsing', () => {
  it('accepts valid structured analysis', () => {
    const result = aiAnalysisResultSchema.parse({
      summary: 'Qualified SaaS lead asking for an operations dashboard build.',
      category: 'sales_lead',
      priority: 'high',
      leadScore: 88,
      sentiment: 'positive',
      suggestedReply: 'Thanks for reaching out. We can schedule a discovery session this week.',
      recommendedNextStep: 'Book a qualification call and prepare a scoping checklist.'
    });

    expect(result.leadScore).toBe(88);
  });

  it('rejects invalid AI output', () => {
    expect(() =>
      aiAnalysisResultSchema.parse({
        summary: 'Too short',
        category: 'invalid-category',
        priority: 'low',
        leadScore: 200,
        sentiment: 'positive',
        suggestedReply: 'Invalid',
        recommendedNextStep: 'Nope'
      })
    ).toThrow();
  });
});
