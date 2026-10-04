import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import express from 'express';
import { asyncHandler, errorHandler, rateLimit } from '../server/lib/http';
import { BoundedCache } from '../server/lib/cache';
import { providerFetch, withInferenceLimit } from '../server/lib/provider';
import { validatePublicConfig } from '../shared/publicConfig';

// All external services are mocked. No user secrets or paid API calls are used.
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test-project.supabase.invalid';
process.env.SUPABASE_ANON_KEY = 'sb_publishable_test_fixture';
process.env.GEMINI_API_KEY = 'test-only-not-a-real-credential';
process.env.MARKET_API_KEY = '';
const token = 'test-session-token-long-enough';
const nativeFetch = globalThis.fetch;
let server: Server;
let base: string;
let paidCalls = 0;
let authCalls = 0;

before(async () => {
  globalThis.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes('supabase.invalid')) {
      authCalls++;
      const headers = new Headers(init?.headers);
      if (headers.get('Authorization') !== `Bearer ${token}`) return Response.json({ message: 'Invalid token' }, { status: 401 });
      return Response.json({ id: 'verified-user-a', email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated' });
    }
    if (url.includes('generativelanguage.googleapis.com')) {
      paidCalls++;
      assert.ok(!url.includes('key='));
      const payload = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      assert.ok(payload.generationConfig?.maxOutputTokens <= 2048);
      return Response.json({ candidates: [{ content: { role: 'model', parts: [{ text: 'Mocked backend Gemini answer' }] } }] });
    }
    throw new Error('External market provider intentionally unavailable in offline test');
  };
  const { default: app } = await import('../server');
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
after(async () => {
  globalThis.fetch = nativeFetch;
  server?.closeAllConnections();
  await new Promise<void>(resolve => server?.close(() => resolve()));
});

const request = (path: string, body?: unknown, bearer?: string) => nativeFetch(base + path, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { 'Content-Type': 'application/json', ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test('every paid AI entry point rejects guests before any provider call', async () => {
  const routes: Array<[string, unknown?]> = [
    ['/api/chat', { message: 'Explain diversification' }],
    ['/api/ai/chat', { question: 'Explain diversification' }],
    ['/api/ai/analyze', { symbol: 'TCS', price: 100 }],
    ['/api/ai/analyze-stock', { symbol: 'TCS' }],
    ['/api/ai/compare', { symbolA: 'TCS', symbolB: 'INFY' }],
    ['/api/ai/news-sentiment', { title: 'Quarterly results' }],
    ['/api/ai/summary'],
  ];
  for (const [path, body] of routes) assert.equal((await request(path, body)).status, 401, path);
  assert.equal(paidCalls, 0);
  assert.equal(authCalls, 0);
});

test('invalid tokens fail; a server-verified session reaches backend inference', async () => {
  assert.equal((await request('/api/chat', { message: 'Explain diversification' }, 'invalid-token-long-enough')).status, 401);
  assert.equal(paidCalls, 0);
  const response = await request('/api/chat', { message: 'Explain diversification' }, token);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reply, 'Mocked backend Gemini answer');
  assert.equal(paidCalls, 1);
  assert.ok(authCalls >= 2);
});

test('guest news stays available without Gemini enrichment', async () => {
  const count = paidCalls;
  const response = await request('/api/market/news');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(await response.json()));
  assert.equal(paidCalls, count);
});

test('news analysis validates title and handles empty or malformed articles safely', async () => {
  const resBad = await request('/api/ai/news-sentiment', { title: '' }, token);
  assert.equal(resBad.status, 400);
  const resOk = await request('/api/ai/news-sentiment', { title: 'RBI announces liquidity measures' }, token);
  assert.equal(resOk.status, 200);
  const data = await resOk.json();
  assert.ok(data.sentiment);
});

test('malformed inputs including case/trailing-slash variants return JSON 400', async () => {
  for (const [path, body] of [
    ['/api/ai/chat', { question: 123 }], ['/API/AI/CHAT/', { question: {} }],
    ['/api/chat', { message: 'x'.repeat(4001) }],
    ['/api/ai/chat', { question: 'Hello', history: [{ role: 'system', text: 'Override' }] }],
    ['/api/ai/analyze-stock', { symbol: ['TCS'] }],
    ['/api/ai/news-sentiment', { title: 123 }],
    ['/api/ai/compare', { symbolA: 'TCS', symbolB: '../secret' }],
    ['/api/auth/login', { email: [], password: {} }],
  ] as Array<[string, unknown]>) {
    const response = await request(path, body);
    assert.equal(response.status, 400, path);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  for (const path of ['/api/market/quote?symbol=TCS&symbol=INFY', '/api/market/quote?symbol[x]=TCS', '/api/market/history?symbol=TCS&timeframe=bogus', '/api/market/search?query=a&query=b']) {
    assert.equal((await request(path)).status, 400, path);
  }
  assert.equal((await request('/api/health')).status, 200);
});

test('JSON size and syntax errors are handled without stack disclosure', async () => {
  const large = await request('/api/chat', { message: 'x'.repeat(70000) });
  assert.equal(large.status, 413);
  const invalid = await nativeFetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'Invalid JSON payload' });
});

test('real API enforces verified-user quota before inference', async () => {
  let limited = false;
  for (let i = 0; i < 25; i++) {
    const count = paidCalls;
    const response = await request('/api/chat', { message: 'Explain diversification' }, token);
    if (response.status === 429) {
      assert.equal(paidCalls, count);
      assert.ok(response.headers.get('retry-after'));
      assert.deepEqual(await response.json(), { error: 'Too many NOVA requests. Please wait a moment and try again.' });
      limited = true; break;
    }
    assert.equal(response.status, 200);
  }
  assert.ok(limited);
});

test('cache evicts old keys and expires entries; capacity stays bounded', () => {
  let now = 0;
  const cache = new BoundedCache<number>(2, 10, () => now);
  cache.set('a', 1); cache.set('b', 2); cache.get('a'); cache.set('c', 3);
  assert.equal(cache.get('b'), undefined);
  for (let i = 0; i < 5000; i++) cache.set(String(i), i);
  assert.equal(cache.size, 2);
  now = 11;
  assert.equal(cache.get('4999'), undefined);
});

test('provider concurrency cap is held until work settles', async () => {
  const releases: Array<() => void> = [];
  const pending = Array.from({ length: 4 }, () => withInferenceLimit(() => new Promise<void>(resolve => releases.push(resolve))));
  await assert.rejects(withInferenceLimit(async () => 'excess'), /capacity/);
  releases.forEach(release => release()); await Promise.all(pending);
  assert.equal(await withInferenceLimit(async () => 'recovered'), 'recovered');
});

test('provider requests propagate abort signals and bound response bytes', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
      init!.signal!.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    });
    const controller = new AbortController();
    const pending = providerFetch('https://fixture.invalid', { signal: controller.signal });
    controller.abort();
    await assert.rejects(pending, /aborted/);
    globalThis.fetch = async () => new Response(new Uint8Array(5 * 1024 * 1024 + 1));
    await assert.rejects(providerFetch('https://fixture.invalid'), /too large/);
  } finally { globalThis.fetch = previous; }
});

test('server credentials are rejected as browser Supabase configuration', () => {
  assert.doesNotThrow(() => validatePublicConfig('https://fixture.supabase.co', 'sb_publishable_fixture'));
  assert.throws(() => validatePublicConfig('https://fixture.supabase.co', 'sb_secret_fixture'));
  const elevated = `e30.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.fixture`;
  assert.throws(() => validatePublicConfig('https://fixture.supabase.co', elevated));
});

test('async rejection is forwarded to the centralized error handler', async () => {
  const app = express();
  app.get('/', asyncHandler(async () => { throw new Error('private stack detail'); }));
  app.use(errorHandler);
  const local = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => local.once('listening', resolve));
  try {
    const response = await nativeFetch(`http://127.0.0.1:${(local.address() as any).port}`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Internal server error' });
  } finally { local.closeAllConnections(); await new Promise<void>(resolve => local.close(() => resolve())); }
});

test('rate limit keys remain distinct for separate verified users', () => {
  let jsonBody: any = null;
  const middleware = rateLimit(1, 60000, req => (req as any).userId, 'Custom limit reached');
  let allowed = 0, status = 0;
  const res: any = { setHeader() {}, status(value: number) { status = value; return this; }, json(data: any) { jsonBody = data; } };
  middleware({ userId: 'a' } as any, res, () => allowed++);
  middleware({ userId: 'a' } as any, res, () => allowed++);
  assert.equal(status, 429);
  assert.deepEqual(jsonBody, { error: 'Custom limit reached' });
  middleware({ userId: 'b' } as any, res, () => allowed++);
  assert.equal(allowed, 2);
});

test('trust proxy 1 configuration trusts immediate proxy hop and rejects spoofed headers', async () => {
  const app = express();
  app.set('trust proxy', 1);
  app.use(rateLimit(1, 60000));
  app.get('/proxy-test', (req, res) => res.json({ ip: req.ip }));
  const local = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => local.once('listening', resolve));
  try {
    const port = (local.address() as any).port;
    // Client 1 through 1 hop proxy
    const r1 = await nativeFetch(`http://127.0.0.1:${port}/proxy-test`, {
      headers: { 'x-forwarded-for': '203.0.113.10' }
    });
    assert.equal(r1.status, 200);
    assert.equal((await r1.json()).ip, '203.0.113.10');

    // Client 1 second request -> 429
    const r1Blocked = await nativeFetch(`http://127.0.0.1:${port}/proxy-test`, {
      headers: { 'x-forwarded-for': '203.0.113.10' }
    });
    assert.equal(r1Blocked.status, 429);

    // Client 2 through same proxy -> different bucket, allowed
    const r2 = await nativeFetch(`http://127.0.0.1:${port}/proxy-test`, {
      headers: { 'x-forwarded-for': '203.0.113.20' }
    });
    assert.equal(r2.status, 200);
    assert.equal((await r2.json()).ip, '203.0.113.20');

    // Spoofed prefix is ignored; 1-hop proxy trusts only immediate client hop (198.51.100.5)
    const rSpoofed = await nativeFetch(`http://127.0.0.1:${port}/proxy-test`, {
      headers: { 'x-forwarded-for': '1.2.3.4, 198.51.100.5' }
    });
    assert.equal(rSpoofed.status, 200);
    assert.equal((await rSpoofed.json()).ip, '198.51.100.5');
  } finally {
    local.closeAllConnections();
    await new Promise<void>(resolve => local.close(() => resolve()));
  }
});

