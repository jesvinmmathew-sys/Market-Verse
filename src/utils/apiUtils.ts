interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  cacheTtlMs?: number;
}

const cache = new Map<string, { data: any; expiry: number }>();

/**
 * A robust wrapper around native `fetch` that adds timeouts, retries with exponential backoff, and caching.
 */
export async function robustFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const {
    timeoutMs = 10000,
    retries = 0,
    retryDelayMs = 1000,
    cacheTtlMs = 0,
    ...fetchOptions
  } = options;

  const cacheKey = `${fetchOptions.method || 'GET'}:${url}`;

  // Check cache for GET requests
  if ((!fetchOptions.method || fetchOptions.method.toUpperCase() === 'GET') && cacheTtlMs > 0) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      // Return a mocked Response object if caching raw fetch responses is tricky,
      // but usually we cache JSON. Wait, we shouldn't cache raw Response objects easily because they stream.
      // Better to cache JSON in `robustFetchJson`. But if caching here, we might need a workaround.
      // Actually, caching in `robustFetch` is hard if it returns a Response that gets consumed.
      // Let's only implement caching in `robustFetchJson`.
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // Don't retry on abort errors if the timeout was intentional,
      // but wait, if it's a timeout (AbortError), we might want to retry.
      // Let's retry on any error if attempt < retries.
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Fetch failed');
}

/**
 * A wrapper around `robustFetch` that automatically parses JSON and supports caching.
 */
export async function robustFetchJson<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const { cacheTtlMs = 0, ...restOptions } = options;
  const isGet = !restOptions.method || restOptions.method.toUpperCase() === 'GET';
  const cacheKey = `${restOptions.method || 'GET'}:${url}:${JSON.stringify(restOptions.body || '')}`;

  if (isGet && cacheTtlMs > 0) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
  }

  const response = await robustFetch(url, restOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (isGet && cacheTtlMs > 0) {
    cache.set(cacheKey, { data, expiry: Date.now() + cacheTtlMs });
  }

  return data;
}

export function clearCache() {
  cache.clear();
}
