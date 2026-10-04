import type { RequestHandler } from 'express';
import { createAuthClient } from '../config/supabaseClient.js';
import { asyncHandler, HttpError, rateLimit } from './http.js';

export const verifySession = (required: boolean): RequestHandler => asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    if (required) throw new HttpError(401, 'Sign in to use live AI');
    return next();
  }
  const match = /^Bearer ([A-Za-z0-9_.-]{20,8192})$/.exec(header);
  if (!match) throw new HttpError(401, 'Invalid authorization');
  const { data, error } = await createAuthClient().auth.getUser(match[1]);
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session');
  res.locals.userId = data.user.id;
  res.locals.accessToken = match[1];
  next();
});

// Per-instance quotas; production replicas also need shared/edge enforcement.
export const aiMinuteQuota = rateLimit(20, 60000, req => (req as any).verifiedUserId || req.ip || 'unknown');
export const aiDailyQuota = rateLimit(200, 86400000, req => (req as any).verifiedUserId || req.ip || 'unknown');
export const attachVerifiedIdentity: RequestHandler = (req, res, next) => {
  (req as any).verifiedUserId = res.locals.userId;
  next();
};
