/**
 * @fileoverview Supabase SDK client configuration module.
 * 
 * Instantiates and exports standard and administrative Supabase client instances for database interaction,
 * JWT authentication validation, and administrative user management.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Standard Supabase client initialized with the public Anonymous API key.
 * Used for standard client interactions and user-scoped data queries.
 * Configured with session persistence and auto-refresh disabled for stateless backend API usage.
 */
export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Administrative Supabase client initialized with the Service Role Key.
 * Grants elevated privileges for administrative operations such as verifying JWT tokens,
 * managing user accounts, and bypassing RLS policies when necessary in secure backend contexts.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL || 'https://placeholder.supabase.co',
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || 'placeholder-service-role-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

