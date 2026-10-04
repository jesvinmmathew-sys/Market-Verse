import type { RequestHandler, ErrorRequestHandler, Request } from 'express';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const asyncHandler = (handler: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve().then(() => handler(req, res, next)).catch(next);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) return _next(error);
  const status = error instanceof HttpError ? error.status : error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : 500;
  res.status(status).json({ error: error instanceof HttpError ? error.message : status === 413 ? 'Request too large' : status === 400 ? 'Invalid JSON payload' : 'Internal server error' });
};

export function text(value: unknown, name: string, max = 4000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new HttpError(400, `Invalid ${name}`);
  return value.trim();
}
export function symbol(value: unknown): string {
  const normalized = text(value, 'symbol', 32).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9&. :^/_-]{0,31}$/.test(normalized)) throw new HttpError(400, 'Invalid symbol');
  return normalized;
}
export function timeframe(value: unknown = '1M'): string {
  const frame = text(value, 'timeframe', 3);
  if (!['1m', '5m', '15m', '1h', '1H', '1D', '5D', '1M', '6M', '1Y', '5Y'].includes(frame)) throw new HttpError(400, 'Unsupported timeframe');
  return frame;
}

export const validateApiInput: RequestHandler = (req, _res, next) => {
  if (req.method === 'POST' && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) throw new HttpError(400, 'Expected a JSON object');
  const body = req.body || {};
  const route = req.path.replace(/\/+$/, '').toLowerCase();
  if (route === '/chat') body.message = text(body.message, 'message');
  if (route === '/ai/chat') body.question = text(body.question, 'question');
  if (['/ai/chat', '/chat'].includes(route) && body.history !== undefined) {
    if (!Array.isArray(body.history) || body.history.length > 12) throw new HttpError(400, 'Invalid history');
    let total = 0;
    body.history = body.history.map((item: any) => {
      if (!item || !['user', 'model'].includes(item.role)) throw new HttpError(400, 'Invalid history role');
      const value = text(item.text, 'history text', 4000); total += value.length;
      return { role: item.role, text: value };
    });
    if (total > 16000) throw new HttpError(400, 'History too large');
  }
  if (['/ai/analyze', '/ai/analyze-stock'].includes(route)) body.symbol = symbol(body.symbol);
  if (route === '/ai/compare') { body.symbolA = symbol(body.symbolA); body.symbolB = symbol(body.symbolB); }
  if (body.price !== undefined && (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price <= 0)) throw new HttpError(400, 'Invalid price');
  if (route === '/ai/analyze') {
    if (body.price === undefined) throw new HttpError(400, 'Missing price');
    if (body.historySnippet !== undefined) {
      if (!Array.isArray(body.historySnippet) || body.historySnippet.length > 100) throw new HttpError(400, 'Invalid history snippet');
      for (const candle of body.historySnippet) {
        if (!candle || typeof candle !== 'object' || Array.isArray(candle) || JSON.stringify(candle).length > 500) throw new HttpError(400, 'Invalid candle');
        for (const value of Object.values(candle)) if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) throw new HttpError(400, 'Invalid candle value');
      }
    }
  }
  if (route === '/ai/news-sentiment') {
    body.title = text(body.title, 'title', 500);
    if (body.text !== undefined) body.text = text(body.text, 'news text', 8000);
  }
  if (['/market/quote', '/market/history'].includes(route)) req.query.symbol = symbol(req.query.symbol);
  if (route === '/market/history') req.query.timeframe = timeframe(req.query.timeframe);
  if (route === '/market/search' && req.query.query !== undefined) {
    if (typeof req.query.query !== 'string' || req.query.query.length > 80) throw new HttpError(400, 'Invalid search query');
  }
  next();
};

/** Per-process limits; production replicas also need an edge/shared quota. */
export function rateLimit(limit: number, windowMs: number, key: (req: Request) => string = req => req.ip || 'unknown'): RequestHandler {
  const entries = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const now = Date.now();
    for (const [id, entry] of entries) if (entry.reset <= now) entries.delete(id);
    const id = key(req);
    let entry = entries.get(id);
    if (!entry) {
      if (entries.size >= 10000) return res.status(503).json({ error: 'Request capacity reached' });
      entry = { count: 0, reset: now + windowMs }; entries.set(id, entry);
    }
    if (++entry.count > limit) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: 'Request limit reached. Please try again later.' });
    }
    next();
  };
}
