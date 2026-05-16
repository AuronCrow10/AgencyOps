import { z } from 'zod';
import { paginationQuerySchema, webhookEventTypeSchema } from '@agencyops/shared';

const emptyStringToUndefined = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const createWebhookSchema = z.object({
  name: z.string().trim().min(2).max(120),
  url: z.string().url(),
  isActive: z.boolean().default(true),
  eventTypes: z.array(webhookEventTypeSchema).min(1)
});

export const updateWebhookSchema = createWebhookSchema.partial().extend({
  rotateSecret: z.boolean().optional()
});

export const webhookDeliveryListSchema = paginationQuerySchema.extend({
  status: emptyStringToUndefined(z.enum(['pending', 'success', 'failed', 'retrying'])),
  endpointId: z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().optional())
});
