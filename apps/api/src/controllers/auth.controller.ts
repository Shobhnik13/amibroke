import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async-handler';
import { getOAuthUrl, completeWebAuth, initiateDevice, pollDevice, getProfile } from '../services/auth.service';
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

export const deviceInit = asyncHandler(async (_req, res) => {
  const data = await initiateDevice();
  res.json(data);
});

export const devicePoll = asyncHandler(async (req, res) => {
  const { device_code } = req.body as { device_code?: string };

  if (!device_code) {
    res.status(400).json({ error: 'device_code is required' });
    return;
  }

  const result = await pollDevice(device_code);
  res.json(result);
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
