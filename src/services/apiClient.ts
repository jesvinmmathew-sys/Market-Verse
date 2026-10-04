import { supabase } from '../supabaseClient';
import { accountRequest, getAccountEpoch } from './accountStorage';

/** A local API request; the server independently verifies this access token. */
export async function apiFetch(path: string, options: RequestInit = {}) {
  if (!path.startsWith('/api/') || path.startsWith('//')) throw new Error('Invalid API path');
  const epoch = getAccountEpoch();
  const pending = accountRequest();
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (epoch !== getAccountEpoch() || pending.signal.aborted) throw new Error('Account changed');
    const headers = new Headers(options.headers);
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
    const signals = [pending.signal, AbortSignal.timeout(45000)];
    if (options.signal) signals.push(options.signal);
    const response = await fetch(path, { ...options, headers, signal: AbortSignal.any(signals) });
    // Consume under the same account cancellation boundary, not after release.
    const bytes = await response.arrayBuffer();
    if (epoch !== getAccountEpoch()) throw new Error('Account changed');
    return new Response([204, 205, 304].includes(response.status) ? null : bytes, { status: response.status, statusText: response.statusText, headers: response.headers });
  } finally { pending.release(); }
}
