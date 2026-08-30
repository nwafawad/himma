import { z } from 'zod';
import { avatarUrlSchema } from './profile.js';
import { uuidSchema } from './common.js';

export const signUpInputSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginInputSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const authUserSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string().datetime().optional(),
  avatarUrl: avatarUrlSchema.nullable().optional(),
});

export const authSessionResponseSchema = z.object({
  data: z.object({
    token: z.string().min(1),
    user: authUserSchema,
  }),
});

export const currentUserResponseSchema = z.object({
  data: authUserSchema.extend({
    profile: z.object({
      avatarUrl: avatarUrlSchema.nullable(),
      targetPath: z.string().nullable(),
      currentSkills: z.array(z.string()),
      interests: z.array(z.string()),
    }).nullable().optional(),
  }),
});

export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>;
