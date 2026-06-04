import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/async-handler';
import { processSync, unregisterDaemon } from '../services/sync.service';

const recordSchema = z.object({
  agent: z.enum(['claude_code', 'opencode', 'codex']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  model: z.string().default('unknown'),
  input_tokens: z.number().int().min(0).default(0),
  output_tokens: z.number().int().min(0).default(0),
  cache_read_tokens: z.number().int().min(0).default(0),
  cache_write_tokens: z.number().int().min(0).default(0),
  cost_usd: z.string().regex(/^\d+(\.\d+)?$/).default('0'),
});

const syncBodySchema = z.object({
  records: z.array(recordSchema).max(5000),
  client_version: z.string().optional(),
});

export const sync = asyncHandler(async (req, res) => {
  const { sub: userId } = (req as AuthRequest).user;

  const parsed = syncBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const result = await processSync(userId, parsed.data.records, parsed.data.client_version);

  if (!result.ok) {
    res.status(500).json({ error: result.error });
    return;
  }

  res.json(result);
});

export const unregister = asyncHandler(async (req, res) => {
  const { sub: userId } = (req as AuthRequest).user;
  const { reason } = req.body as { reason?: 'stopped' | 'uninstalled' };

  await unregisterDaemon(userId, reason === 'uninstalled' ? 'uninstalled' : 'stopped');
  res.json({ ok: true });
});
