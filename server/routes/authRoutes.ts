import { Router } from "express";
import { createAuthClient } from "../config/supabaseClient.js";
import { asyncHandler, text, HttpError } from "../lib/http.js";
import { verifySession } from "../lib/access.js";
import { providerFetch } from "../lib/provider.js";

const router = Router();
router.use((req, _res, next) => {
  const route = req.path.replace(/\/+$/, '').toLowerCase();
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw new HttpError(400, 'Expected a JSON object');
  if (['/signup', '/login', '/resend-verification'].includes(route)) {
    req.body.email = text(req.body.email, 'email', 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) throw new HttpError(400, 'Invalid email');
  }
  if (['/signup', '/login'].includes(route)) {
    // Validate without trimming passwords, since whitespace may be intentional.
    text(req.body.password, 'password', 128);
  }
  if (req.body.fullName !== undefined) req.body.fullName = text(req.body.fullName, 'full name', 150);
  if (req.body.avatarUrl !== undefined && req.body.avatarUrl !== null) {
    text(req.body.avatarUrl, 'avatar', 40000);
    if (!/^(https:\/\/|data:image\/(?:png|jpeg|webp);base64,)/.test(req.body.avatarUrl)) throw new HttpError(400, 'Invalid avatar');
  }
  next();
});
router.use('/update-profile', verifySession(true));

// POST /signup
router.post("/signup", asyncHandler(async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await createAuthClient().auth.signUp({
      email,
      password,
      options: fullName ? {
        data: {
          full_name: fullName
        }
      } : undefined
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: "User signed up successfully.",
      user: data.user,
      session: data.session,
    });
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    return res.status(500).json({ error: "Unable to complete authentication request" });
  }
}));

// POST /login
router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await createAuthClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Logged in successfully",
      user: data.user,
      session: data.session,
    });
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    return res.status(500).json({ error: "Unable to complete authentication request" });
  }
}));

// POST /resend-verification
router.post("/resend-verification", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const { error } = await createAuthClient().auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Verification email resent successfully.",
    });
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    return res.status(500).json({ error: "Unable to complete authentication request" });
  }
}));

// POST /update-profile
router.post("/update-profile", asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header provided" });
  }

  const { fullName, avatarUrl } = req.body;

  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
    const response = await providerFetch(`${url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: key, Authorization: `Bearer ${res.locals.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { full_name: fullName, avatar_url: avatarUrl } }),
    });
    if (!response.ok) throw new HttpError(400, 'Unable to update profile');
    const data = { user: await response.json() };

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: data.user
    });
  } catch (err: any) {
    if (err instanceof HttpError) throw err;
    return res.status(500).json({ error: "Unable to complete authentication request" });
  }
}));

export default router;
