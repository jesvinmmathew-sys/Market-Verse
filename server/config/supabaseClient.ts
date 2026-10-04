import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { validatePublicConfig } from '../../shared/publicConfig.js';
import { HttpError } from '../lib/http.js';
import { providerFetch } from '../lib/provider.js';

dotenv.config();

export function createAuthClient(token?: string) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  if (!url || !key) throw new HttpError(503, 'Authentication is not configured');
  try { validatePublicConfig(url, key); } catch { throw new HttpError(503, 'Invalid authentication configuration'); }
  return createClient(url.replace(/\/rest\/v1\/?$/, ''), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: providerFetch, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) },
  });
}
