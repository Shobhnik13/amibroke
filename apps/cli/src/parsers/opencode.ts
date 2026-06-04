import { join } from 'path';
import { addToAgg, type AggMap } from '../lib/aggregate';
import { calcCost, normalizeModel } from '../lib/pricing';

interface MessageData {
  type: string;
  model?: string;
  tokens?: {
    input?: number;
    output?: number;
    cache?: { read?: number; write?: number };
  };
  cost?: number;
  time?: { created?: number };
}

interface MessageRow {
  time_created: number;
  data: string;
}

// Parses ~/.local/share/opencode/opencode.db (SQLite)
// Returns updated last_timestamp cursor (ISO string)
export async function parseOpencode(
  agg: AggMap,
  lastTimestamp: string,
): Promise<string> {
  const dbPath = join(process.env.HOME!, '.local', 'share', 'opencode', 'opencode.db');

  if (!(await Bun.file(dbPath).exists())) return lastTimestamp;

  const { Database } = await import('bun:sqlite');
  const db = new Database(dbPath, { readonly: true, create: false });

  const cutoffMs = new Date(lastTimestamp).getTime();
  let maxSeen = cutoffMs;

  try {
    const rows = db
      .query<MessageRow, [number]>(
        `SELECT time_created, data FROM message WHERE time_created > ? ORDER BY time_created ASC`,
      )
      .all(cutoffMs);

    for (const row of rows) {
      let msg: MessageData;
      try {
        msg = JSON.parse(row.data);
      } catch {
        continue;
      }

      if (msg.type !== 'assistant') continue;

      const model = msg.model;
      const tokens = msg.tokens;
      if (!model || !tokens) continue;

      const date = new Date(row.time_created).toISOString().slice(0, 10);

      const normModel  = normalizeModel(model);
      const input      = tokens.input ?? 0;
      const output     = tokens.output ?? 0;
      const cacheRead  = tokens.cache?.read ?? 0;
      const cacheWrite = tokens.cache?.write ?? 0;

      addToAgg(agg, 'opencode', date, normModel, {
        input,
        output,
        cache_read: cacheRead,
        cache_write: cacheWrite,
        cost_usd: msg.cost ?? calcCost(normModel, input, output, cacheRead, cacheWrite),
      });

      if (row.time_created > maxSeen) maxSeen = row.time_created;
    }
  } finally {
    db.close();
  }

  return new Date(maxSeen).toISOString();
}
