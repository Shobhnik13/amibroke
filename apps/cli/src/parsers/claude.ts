import { join } from 'path';
import { addToAgg, type AggMap } from '../lib/aggregate';
import { calcCost, normalizeModel } from '../lib/pricing';

interface ClaudeEntry {
  type: string;
  timestamp: string;
  costUSD?: number;
  message?: {
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
}

// Parses ~/.claude/projects/**/*.jsonl
// Only reads bytes past the saved cursor for each file
export async function parseClaude(
  agg: AggMap,
  cursors: Record<string, number>,
): Promise<Record<string, number>> {
  const newCursors: Record<string, number> = { ...cursors };
  const baseDir = join(process.env.HOME!, '.claude', 'projects');

  const glob = new Bun.Glob('**/*.jsonl');

  for await (const relative of glob.scan({ cwd: baseDir })) {
    const filePath = join(baseDir, relative);
    const file = Bun.file(filePath);
    const size = file.size;
    const cursor = newCursors[filePath] ?? 0;

    if (size <= cursor) continue;

    const text = await file.slice(cursor, size).text();
    newCursors[filePath] = size;

    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line) continue;

      let entry: ClaudeEntry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      if (entry.type !== 'assistant') continue;

      const usage = entry.message?.usage;
      const model = entry.message?.model;
      if (!model || !usage || model === '<synthetic>') continue;

      const date      = entry.timestamp.slice(0, 10);
      const normModel = normalizeModel(model);
      const input     = usage.input_tokens ?? 0;
      const output    = usage.output_tokens ?? 0;
      const cacheRead = usage.cache_read_input_tokens ?? 0;
      const cacheWrite = usage.cache_creation_input_tokens ?? 0;

      addToAgg(agg, 'claude_code', date, normModel, {
        input,
        output,
        cache_read: cacheRead,
        cache_write: cacheWrite,
        cost_usd: entry.costUSD ?? calcCost(normModel, input, output, cacheRead, cacheWrite),
      });
    }
  }

  return newCursors;
}
