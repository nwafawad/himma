import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Standard Supabase client initialized with Anonymous API key
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

// Admin Supabase client initialized with Service Role Key (for administrative operations)
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
