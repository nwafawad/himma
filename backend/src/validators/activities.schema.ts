import { z } from 'zod';
import { ActivitySource, ActivityType } from '@prisma/client';

export const createActivitySchema = z.object({
  source: z.nativeEnum(ActivitySource).optional().default(ActivitySource.manual),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL format').optional().nullable(),
  type: z.nativeEnum(ActivityType),
  tags: z.array(z.string()).optional().default([]),
  consumedAt: z.string().datetime().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
