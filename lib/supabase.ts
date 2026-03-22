import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const missingEnvMessage =
  'Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).';

const createMissingEnvClient = () => {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(missingEnvMessage);
      },
    }
  ) as SupabaseClient;
};

const createSupabaseClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseKey) {
    return createMissingEnvClient();
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

declare global {
  var __supabase: undefined | SupabaseClient;
}

const supabase = globalThis.__supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__supabase = supabase;
}

export { supabase };
