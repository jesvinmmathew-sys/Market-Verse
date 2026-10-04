let owner: string | null = null;
let verifiedUser: any = null;
let epoch = 0;
const pendingRequests = new Set<AbortController>();

export function getVerifiedUser() { return verifiedUser; }
export function getAccountEpoch() { return epoch; }

/** Called only by the Auth boundary after server verification (or explicit logout). */
export function selectVerifiedAccount(user: any | null) {
  const nextOwner = user?.id || null;
  if (nextOwner !== owner) {
    for (const request of pendingRequests) request.abort();
    pendingRequests.clear();
    clearAccountData(null);
    epoch++;
  }
  owner = nextOwner;
  verifiedUser = user;
}

export function accountRequest() {
  const controller = new AbortController();
  pendingRequests.add(controller);
  return { signal: controller.signal, release: () => pendingRequests.delete(controller) };
}

function prefix(id: string | null) { return `marketverse:v1:${id ? `user:${encodeURIComponent(id)}` : 'guest'}:`; }

export function clearAccountData(id: string | null = owner) {
  const storage = id ? localStorage : sessionStorage;
  const start = prefix(id);
  for (let i = storage.length - 1; i >= 0; i--) {
    const key = storage.key(i);
    if (key?.startsWith(start)) storage.removeItem(key);
  }
}

/** Capture ownership at mount; stale async completions cannot write to another account. */
export function accountStorage() {
  const id = owner;
  const version = epoch;
  const storage = id ? localStorage : sessionStorage;
  const start = prefix(id);
  const current = () => version === epoch && owner === id;
  return {
    getItem: (key: string) => current() ? storage.getItem(start + key) : null,
    setItem: (key: string, value: string) => { if (current()) storage.setItem(start + key, value); },
    removeItem: (key: string) => { if (current()) storage.removeItem(start + key); },
  };
}

export function assertAccountEpoch(expected: number) {
  if (expected !== epoch) throw new Error("Account changed; request cancelled");
}
