import { z } from 'zod';

export const upsertProfileSchema = z.object({
  avatarUrl: z.string().url().optional().nullable(),
  currentSkills: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  targetPath: z.string().optional().nullable(),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
