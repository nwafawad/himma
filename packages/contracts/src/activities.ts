import { z } from 'zod';
import { paginatedResponseSchema, uuidSchema } from './common.js';

export const activitySourceSchema = z.enum(['manual', 'import', 'extension']);
export const activityTypeSchema = z.enum(['article', 'video', 'course', 'repository', 'other']);

export const activitySchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  source: activitySourceSchema,
  title: z.string(),
  url: z.string().url().nullable(),
  type: activityTypeSchema,
  tags: z.array(z.string()),
  consumedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const createActivityInputSchema = z.object({
  source: activitySourceSchema.optional().default('manual'),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL format').optional().nullable(),
  type: activityTypeSchema,
  tags: z.array(z.string()).optional().default([]),
  consumedAt: z.string().datetime().optional(),
});

export const updateActivityInputSchema = createActivityInputSchema.partial();
export const activitiesResponseSchema = paginatedResponseSchema(activitySchema);

export type Activity = z.infer<typeof activitySchema>;
export type ActivitySource = z.infer<typeof activitySourceSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;
export type UpdateActivityInput = z.infer<typeof updateActivityInputSchema>;
export type ActivitiesResponse = z.infer<typeof activitiesResponseSchema>;
