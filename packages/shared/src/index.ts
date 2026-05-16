import { z } from 'zod';

export const userRoleSchema = z.enum(['owner', 'admin', 'operator']);
export const leadStatusSchema = z.enum([
  'new',
  'analyzing',
  'qualified',
  'contacted',
  'won',
  'lost',
  'archived'
]);
export const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const aiCategorySchema = z.enum([
  'sales_lead',
  'support_request',
  'partnership',
  'spam',
  'other'
]);
export const sentimentSchema = z.enum(['negative', 'neutral', 'positive']);
export const taskStatusSchema = z.enum(['open', 'in_progress', 'completed', 'canceled']);
export const webhookEventTypeSchema = z.enum([
  'lead.created',
  'lead.analyzed',
  'lead.status_changed',
  'task.created'
]);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional()
});

export const publicLeadInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  company: z.string().trim().min(2).max(255),
  website: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  budgetRange: z.string().trim().min(2).max(120),
  serviceNeeded: z.string().trim().min(2).max(255),
  deadline: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(5000)
});

export const aiAnalysisResultSchema = z.object({
  summary: z.string().min(10).max(2000),
  category: aiCategorySchema,
  priority: prioritySchema,
  leadScore: z.number().int().min(0).max(100),
  sentiment: sentimentSchema,
  suggestedReply: z.string().min(10).max(4000),
  recommendedNextStep: z.string().min(5).max(1000)
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(255)
});

export const registerSchema = z.object({
  organizationName: z.string().trim().min(2).max(255),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z
    .string()
    .min(10)
    .max(255)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type LeadStatus = z.infer<typeof leadStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type AICategory = z.infer<typeof aiCategorySchema>;
export type Sentiment = z.infer<typeof sentimentSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type WebhookEventType = z.infer<typeof webhookEventTypeSchema>;
export type PublicLeadInput = z.infer<typeof publicLeadInputSchema>;
export type AIAnalysisResult = z.infer<typeof aiAnalysisResultSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
