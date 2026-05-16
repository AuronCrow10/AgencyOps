import { z } from 'zod';

export const updateSettingsSchema = z.object({
  organizationName: z.string().trim().min(2).max(255).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  notifyEmail: z.string().trim().email().nullable().optional()
});
