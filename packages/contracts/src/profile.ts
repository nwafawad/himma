import { z } from 'zod';
import { uuidSchema } from './common.js';

export const localAvatarPathSchema = z.string().regex(
  /^\/uploads\/avatars\/[a-zA-Z0-9._-]+$/,
  'Invalid locally hosted avatar path'
);

export const avatarUrlSchema = z.union([z.string().url(), localAvatarPathSchema]);

export const profileSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  avatarUrl: avatarUrlSchema.nullable(),
  currentSkills: z.array(z.string()),
  interests: z.array(z.string()),
  targetPath: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const upsertProfileInputSchema = z.object({
  avatarUrl: avatarUrlSchema.optional().nullable(),
  currentSkills: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  targetPath: z.string().optional().nullable(),
});

export const profileResponseSchema = z.object({ data: profileSchema });

export const avatarUploadResponseSchema = z.object({
  data: z.object({
    url: avatarUrlSchema,
    filename: z.string(),
    size: z.number().int().nonnegative(),
    mimetype: z.string(),
  }),
});

export type Profile = z.infer<typeof profileSchema>;
export type UpsertProfileInput = z.infer<typeof upsertProfileInputSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type AvatarUploadResponse = z.infer<typeof avatarUploadResponseSchema>;
