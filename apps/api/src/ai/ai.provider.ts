import type { AIAnalysisResult } from '@agencyops/shared';

export type AILeadInput = {
  company: string;
  serviceNeeded: string;
  budgetRange: string;
  deadline: string;
  website?: string | null;
  message: string;
  email: string;
  name: string;
};

export type AIProviderResponse = {
  provider: string;
  model: string;
  rawInput: unknown;
  rawOutput: unknown;
  parsedOutput: AIAnalysisResult;
  costEstimate?: number;
};

export interface AIProvider {
  analyzeLead(input: AILeadInput): Promise<AIProviderResponse>;
}
