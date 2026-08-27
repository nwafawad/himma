/**
 * @fileoverview Environment variables configuration module.
 * 
 * Loads, parses, and validates environment variables using Zod schemas.
 * Guarantees type-safe access to runtime configurations including database connection strings,
 * JWT authentication secrets, Gemini AI parameters, CORS settings, and application limits.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Zod schema defining structure, default values, and type transformations for environment variables.
 */
const numericEnv = (name: string, fallback: string, min: number, max: number) =>
  z.string().default(fallback).transform((value, ctx) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${name} must be an integer between ${min} and ${max}` });
      return z.NEVER;
    }
    return parsed;
  });

const envSchema = z.object({
  /** HTTP server listening port (defaults to 8000). */
  PORT: numericEnv('PORT', '8000', 1, 65535),
  
  /** Application execution environment mode. */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  /** Allowed origins for Cross-Origin Resource Sharing (CORS). */
  CORS_ORIGIN: z.string().default('*'),
  
  /** Frontend client URL (optional). */
  CLIENT_URL: z.string().optional(),
  
  /** Primary PostgreSQL database connection string for Prisma. */
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/momentum_db'),
    
  /** Direct database URL for Prisma migrations when using connection poolers (optional). */
  DIRECT_URL: z.string().optional(),
  
  /** Secret key for signing and verifying JWT authentication tokens. */
  JWT_SECRET: z.string().default('momentum-dev-jwt-secret-key-32chars!'),

  /** Token expiration duration string (e.g. '7d', '24h', '30d'). */
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  /** Google Gemini API key for AI insight generation. */
  GEMINI_API_KEY: z.string().optional(),
  
  /** Google Gemini model identifier (defaults to `gemini-2.0-flash`). */
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  
  /** Cron schedule expression for automated batch AI insight jobs (defaults to weekly at midnight on Sunday). */
  INSIGHT_BATCH_CRON: z.string().default('0 0 * * 0'),
  
  /** Minimum activity records required before generating an insight report. */
  MIN_INSIGHT_ACTIVITIES: numericEnv('MIN_INSIGHT_ACTIVITIES', '3', 0, 1000),
  
  /** Minimum note records required before generating an insight report. */
  MIN_INSIGHT_NOTES: numericEnv('MIN_INSIGHT_NOTES', '1', 0, 1000),
  
  /** Maximum number of insight generation runs allowed per user per month. */
  MAX_MONTHLY_INSIGHT_RUNS_PER_USER: numericEnv('MAX_MONTHLY_INSIGHT_RUNS_PER_USER', '10', 1, 10000),
  
  /** Maximum token allowance per AI insight generation run. */
  MAX_TOKENS_PER_RUN: numericEnv('MAX_TOKENS_PER_RUN', '8000', 1, 1_000_000),
}).superRefine((values, ctx) => {
  if (values.NODE_ENV !== 'production') return;

  const required: Array<[string, string | undefined]> = [
    ['DATABASE_URL', values.DATABASE_URL],
    ['JWT_SECRET', values.JWT_SECRET],
  ];
  for (const [name, value] of required) {
    if (!value || value.includes('placeholder') || value.includes('[YOUR-') || value === 'momentum-dev-jwt-secret-key-32chars!') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [name], message: `${name} is required and must not use the default value in production` });
    }
  }
  if (values.CORS_ORIGIN.split(',').map((origin) => origin.trim()).includes('*')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['CORS_ORIGIN'], message: 'Wildcard CORS is forbidden in production' });
  }
  try {
    new URL(values.DATABASE_URL);
    if (values.DIRECT_URL) new URL(values.DIRECT_URL);
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Production database URLs must be valid URLs' });
  }
});

/**
 * Validates process.env against `envSchema`.
 * Throws an error and logs formatting details if validation fails.
 * 
 * @returns Validated and strongly typed environment object.
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Environment variable validation failed');
  }
  return result.data;
};

/**
 * Parsed, validated, and type-safe environment configuration instance.
 */
export const env = parseEnv();
