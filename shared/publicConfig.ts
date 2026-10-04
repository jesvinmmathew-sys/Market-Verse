/** Only publishable/legacy anon keys may cross the browser boundary. */
export function isPublicSupabaseKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try {
    const payload = key.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon';
  } catch { return false; }
}

export function validatePublicConfig(url: string, key: string): void {
  if (!url && !key) return;
  if (!url || !isPublicSupabaseKey(key)) {
    throw new Error('Configure a Supabase URL and publishable (or legacy anon) key. Server secrets are forbidden in frontend configuration.');
  }
  const parsed = new URL(url);
  if (parsed.username || parsed.password || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)))) {
    throw new Error('Invalid public Supabase URL.');
  }
}
