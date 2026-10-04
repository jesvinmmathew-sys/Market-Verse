import { createClient } from "@supabase/supabase-js";
import { validatePublicConfig } from '../shared/publicConfig';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
validatePublicConfig(url, key);
export const supabaseConfigured = Boolean(url && key);

// An inert client keeps the public demo usable without contacting any default project.
export const supabase = createClient(
  url.replace(/\/rest\/v1\/?$/, '') || 'https://configuration-required.invalid',
  key || 'unconfigured',
  {
    auth: { persistSession: supabaseConfigured, autoRefreshToken: supabaseConfigured, detectSessionInUrl: supabaseConfigured },
    global: { fetch: (input, init) => {
      if (!supabaseConfigured) return Promise.reject(new Error('Sign-in is unavailable: Supabase configuration is missing.'));
      return fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(12000) });
    } },
  }
);
export default supabase;
