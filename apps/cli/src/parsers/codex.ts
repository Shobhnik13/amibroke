import { join } from 'path';
import { existsSync } from 'fs';
import { addToAgg, type AggMap } from '../lib/aggregate';
import { calcCost, normalizeModel } from '../lib/pricing';

interface TurnContextEntry {
  type: 'turn_context';
  timestamp: string;
  payload: { model?: string; current_date?: string };
}

interface TokenCountEntry {
  type: 'event_msg';
  timestamp: string;
  payload: {
    type: 'token_count';
    info: {
      last_token_usage: {
        input_tokens?: number;
        output_tokens?: number;
        cached_input_tokens?: number;
      };
    };
  };
}

type CodexEntry = TurnContextEntry | TokenCountEntry | { type: string };

// Parses ~/.codex/sessions/**/*.jsonl
// Byte-offset cursors, same strategy as claude.ts
export async function parseCodex(
  agg: AggMap,
  cursors: Record<string, number>,
): Promise<Record<string, number>> {
  const newCursors: Record<string, number> = { ...cursors };
  const baseDir = join(process.env.HOME!, '.codex', 'sessions');

  // Codex not installed — skip silently so other agents still sync
  if (!existsSync(baseDir)) return newCursors;

  const glob = new Bun.Glob('**/*.jsonl');

  for await (const relative of glob.scan({ cwd: baseDir })) {
    const filePath = join(baseDir, relative);
    const file = Bun.file(filePath);
    const size = file.size;
    const cursor = newCursors[filePath] ?? 0;

    if (size <= cursor) continue;

    // Read from beginning to correctly track current model across entries
    // (turn_context may be before the cursor). Only update cursor, not re-aggregate.
    const fullText = await file.text();
    newCursors[filePath] = size;

    let currentModel = 'codex';
    let alreadySeen = 0;

    for (const rawLine of fullText.split('\n')) {
      const byteLen = Buffer.byteLength(rawLine + '\n', 'utf8');
      const isNew = alreadySeen >= cursor;
      alreadySeen += byteLen;

      const line = rawLine.trim();
      if (!line) continue;

      let entry: CodexEntry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      if (entry.type === 'turn_context') {
        currentModel = (entry as TurnContextEntry).payload.model ?? currentModel;
        continue;
      }

      if (!isNew) continue;

      if (
        entry.type === 'event_msg' &&
        (entry as TokenCountEntry).payload?.type === 'token_count'
      ) {
        const e = entry as TokenCountEntry;
        const u = e.payload.info?.last_token_usage;
        if (!u) continue;
        const date = e.timestamp.slice(0, 10);

        const normModel = normalizeModel(currentModel);
        // OpenAI format: input_tokens includes cached_input_tokens, so subtract
        // to avoid billing cached tokens twice (unlike Claude, where they're separate)
        const cacheRead = u.cached_input_tokens ?? 0;
        const input     = Math.max(0, (u.input_tokens ?? 0) - cacheRead);
        const output    = u.output_tokens ?? 0;

        addToAgg(agg, 'codex', date, normModel, {
          input,
          output,
          cache_read: cacheRead,
          cache_write: 0,
          cost_usd: calcCost(normModel, input, output, cacheRead, 0),
        });
      }
    }
  }

  return newCursors;
}
