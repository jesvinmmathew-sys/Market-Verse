import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../supabaseClient';
import { selectVerifiedAccount } from '../services/accountStorage';
import App from '../App';

export function AccountBoundary() {
  const [identity, setIdentity] = useState<string | null>(null);
  useEffect(() => {
    let generation = 0;
    let disposed = false;
    let activeId: string | null = null;
    let initialized = false;
    const sync = async (session: any) => {
      const current = ++generation;
      // Account changes unmount private UI; a routine token refresh preserves it.
      const switching = !initialized || (session?.user?.id || null) !== activeId;
      if (switching) {
        setIdentity(null);
        selectVerifiedAccount(null);
      }
      let user = null;
      if (session?.access_token && supabaseConfigured) {
        try {
          const result = await supabase.auth.getUser(session.access_token);
          if (!result.error) user = result.data.user;
        } catch { /* Failed verification must not restore saved account data. */ }
      }
      if (disposed || current !== generation) return;
      selectVerifiedAccount(user);
      activeId = user?.id || null;
      initialized = true;
      if (user) localStorage.setItem('supabase_user', JSON.stringify(user));
      else localStorage.removeItem('supabase_user');
      // The SDK owns session persistence; do not retain a second token copy.
      localStorage.removeItem('supabase_session');
      setIdentity(user?.id || 'guest');
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Avoid awaiting another Auth SDK call inside its session lock.
      queueMicrotask(() => { if (!disposed) void sync(session); });
    });
    return () => { disposed = true; generation++; subscription.unsubscribe(); };
  }, []);
  return identity === null ? <div role="status" aria-live="polite">Loading session…</div> : <App key={identity} />;
}
