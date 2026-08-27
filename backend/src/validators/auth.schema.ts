/**
 * @file auth.schema.ts
 * @description Zod validation schemas for local authentication (signup, login).
 */

import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
