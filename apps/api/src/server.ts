import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import logger from './lib/logger';
import authRouter from './routers/auth.router';
import syncRouter from './routers/sync.router';
import leaderboardRouter from './routers/leaderboard.router';

const app = express();

app.use(pinoHttp({ logger }));
app.use(cors({ origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/sync', syncRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, `${req.method} ${req.path}`);
  res.status(500).json({ error: 'Internal server error' });
});

if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT ?? '3001', 10);
  app.listen(port, () => logger.info(`API running on http://localhost:${port}`));
}

export default app;
