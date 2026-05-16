import { z } from 'zod';
import {
  aiCategorySchema,
  paginationQuerySchema,
  prioritySchema,
  publicLeadInputSchema,
  leadStatusSchema
} from '@agencyops/shared';

const emptyStringToUndefined = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const publicLeadCreateSchema = publicLeadInputSchema.extend({
  organizationSlug: z.string().trim().optional()
});

export const leadListQuerySchema = paginationQuerySchema.extend({
  status: emptyStringToUndefined(leadStatusSchema),
  priority: emptyStringToUndefined(prioritySchema),
  category: emptyStringToUndefined(aiCategorySchema)
});

export const updateLeadStatusSchema = z.object({
  status: leadStatusSchema
});
