import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JwtPayload } from '../lib/jwt';
import { getUserByApiKeyHash } from '../services/auth.service';

export interface AuthRequest extends Request {
  user: JwtPayload;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const cookieToken = (req as any).cookies?.token as string | undefined;
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const token = cookieToken ?? headerToken;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // API key path (CLI)
  if (token.startsWith('amibroke_')) {
    const user = await getUserByApiKeyHash(token);
    if (!user) {
      res.status(401).json({ error: 'Invalid API key. Please log in at https://amibroke.dev and generate a new key.' });
      return;
    }
    (req as AuthRequest).user = { sub: user.id, username: user.username };
    next();
    return;
  }

  // JWT path (web)
  try {
    (req as AuthRequest).user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
