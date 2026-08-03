import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('*'),
  CLIENT_URL: z.string().optional(),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/momentum_db'),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().default(''),
  SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  INSIGHT_BATCH_CRON: z.string().default('0 0 * * 0'),
  MIN_INSIGHT_ACTIVITIES: z.string().default('3').transform((val) => parseInt(val, 10)),
  MIN_INSIGHT_NOTES: z.string().default('1').transform((val) => parseInt(val, 10)),
  MAX_MONTHLY_INSIGHT_RUNS_PER_USER: z.string().default('10').transform((val) => parseInt(val, 10)),
  MAX_TOKENS_PER_RUN: z.string().default('8000').transform((val) => parseInt(val, 10)),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Environment variable validation failed');
  }
  return result.data;
};

export const env = parseEnv();
