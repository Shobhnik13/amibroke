import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler';
import { getOAuthUrl, completeWebAuth, getProfile, generateApiKey, storeDetectedAgents } from '../services/auth.service';
import type { AuthRequest } from '../middleware/auth';

const webUrl = () => process.env.WEB_URL ?? 'http://localhost:3000';

export const githubRedirect = asyncHandler(async (_req, res) => {
  res.redirect(getOAuthUrl());
});

export const githubCallback = asyncHandler(async (req, res) => {
  const { code, error } = req.query as { code?: string; error?: string };

  if (error || !code) {
    res.redirect(`${webUrl()}?auth_error=cancelled`);
    return;
  }

  const { token } = await completeWebAuth(code);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 90 * 24 * 60 * 60 * 1000,
  });
  res.redirect(`${webUrl()}/dashboard`);
});

export function logout(_req: Request, res: Response): void {
  res.clearCookie('token');
  res.json({ ok: true });
}

export const generateKey = asyncHandler(async (req, res) => {
  const { sub: userId } = (req as AuthRequest).user;
  const { key, prefix } = await generateApiKey(userId);
  res.json({ key, prefix });
});

export const detectedAgents = asyncHandler(async (req, res) => {
  const { sub: userId } = (req as AuthRequest).user;
  const { agents } = req.body as { agents: string[] };

  if (!Array.isArray(agents)) {
    res.status(400).json({ error: 'agents must be an array' });
    return;
  }

  await storeDetectedAgents(userId, agents);
  res.json({ ok: true });
});

export const profile = asyncHandler(async (req, res) => {
  const { sub: userId } = (req as AuthRequest).user;

  const data = await getProfile(userId);
  if (!data) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(data);
});
