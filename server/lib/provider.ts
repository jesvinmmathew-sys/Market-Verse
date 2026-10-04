let activeRequests = 0;
let activeInference = 0;

export async function withInferenceLimit<T>(run: () => Promise<T>): Promise<T> {
  if (activeInference >= 4) throw new Error('AI capacity reached');
  activeInference++;
  try { return await run(); } finally { activeInference--; }
}

/** Timeout covers body consumption too; callers receive a buffered bounded body. */
export async function providerFetch(url: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  if (activeRequests >= 32) throw new Error('Provider capacity reached');
  activeRequests++;
  try {
    const timeout = AbortSignal.timeout(12000);
    const response = await fetch(url, { ...init, signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 5 * 1024 * 1024) { await reader.cancel(); throw new Error('Provider response too large'); }
        chunks.push(value);
      }
    }
    const bytes = Buffer.concat(chunks);
    const headers = new Headers(response.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    return new Response([204, 205, 304].includes(response.status) ? null : bytes, { status: response.status, statusText: response.statusText, headers });
  } finally { activeRequests--; }
}
