/**
 * @fileoverview Environment variables configuration module.
 * 
 * Loads, parses, and validates environment variables using Zod schemas.
 * Guarantees type-safe access to runtime configurations including database connection strings,
 * Supabase integration keys, Gemini AI parameters, CORS settings, and application limits.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Zod schema defining structure, default values, and type transformations for environment variables.
 */
const envSchema = z.object({
  /** HTTP server listening port (defaults to 8000). */
  PORT: z.string().default('8000').transform((val) => parseInt(val, 10)),
  
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
    
  /** Direct database URL for Prisma migrations when using connection poolers. */
  DIRECT_URL: z.string().optional(),
  
  /** Supabase project URL. */
  SUPABASE_URL: z.string().default(''),
  
  /** Supabase anonymous client API key. */
  SUPABASE_ANON_KEY: z.string().default(''),
  
  /** Supabase service role key for administrative backend operations. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  
  /** Google Gemini API key for AI insight generation. */
  GEMINI_API_KEY: z.string().optional(),
  
  /** Google Gemini model identifier (defaults to `gemini-2.0-flash`). */
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  
  /** Cron schedule expression for automated batch AI insight jobs (defaults to weekly at midnight on Sunday). */
  INSIGHT_BATCH_CRON: z.string().default('0 0 * * 0'),
  
  /** Minimum activity records required before generating an insight report. */
  MIN_INSIGHT_ACTIVITIES: z.string().default('3').transform((val) => parseInt(val, 10)),
  
  /** Minimum note records required before generating an insight report. */
  MIN_INSIGHT_NOTES: z.string().default('1').transform((val) => parseInt(val, 10)),
  
  /** Maximum number of insight generation runs allowed per user per month. */
  MAX_MONTHLY_INSIGHT_RUNS_PER_USER: z.string().default('10').transform((val) => parseInt(val, 10)),
  
  /** Maximum token allowance per AI insight generation run. */
  MAX_TOKENS_PER_RUN: z.string().default('8000').transform((val) => parseInt(val, 10)),
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

