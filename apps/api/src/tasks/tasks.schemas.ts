import { z } from 'zod';
import { paginationQuerySchema, taskStatusSchema } from '@agencyops/shared';

const emptyStringToUndefined = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const taskListQuerySchema = paginationQuerySchema.extend({
  status: emptyStringToUndefined(taskStatusSchema)
});

export const createTaskSchema = z.object({
  leadId: z.string().trim().optional(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(2).max(2000),
  dueAt: z.string().datetime().optional(),
  assignedToId: z.string().trim().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().min(2).max(2000).optional(),
  dueAt: z.string().datetime().nullable().optional(),
  assignedToId: z.string().trim().nullable().optional(),
  status: taskStatusSchema.optional()
});
