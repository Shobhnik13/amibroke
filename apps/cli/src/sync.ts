import { loadAuth, loadState, saveState } from './lib/state';
import { createAggMap, aggToRecords } from './lib/aggregate';
import { postSync } from './lib/sync';
import { parseClaude } from './parsers/claude';
import { parseOpencode } from './parsers/opencode';
import { parseCodex } from './parsers/codex';

async function run() {
  const auth = loadAuth();
  if (!auth) {
    console.error('No auth found. Run `bunx amibroke init`');
    process.exit(1);
  }

  const state = loadState();
  const cursors = state.cursors;
  const agg = createAggMap();

  const [claudeCursors, opencodeCursor, codexCursors] = await Promise.all([
    parseClaude(agg, cursors.claude_code ?? {}),
    parseOpencode(agg, cursors.opencode?.last_timestamp ?? new Date(0).toISOString()),
    parseCodex(agg, cursors.codex ?? {}),
  ]);

  const records = aggToRecords(agg);

  const result = await postSync(auth.token, auth.api_url, records);

  await saveState({
    cursors: {
      claude_code: claudeCursors,
      opencode: { last_timestamp: opencodeCursor },
      codex: codexCursors,
    },
    last_sync_at: new Date().toISOString(),
  });

  if (records.length === 0) {
    console.log('Nothing new to sync');
  } else {
    console.log(`Synced ${result.records_upserted} records`);
  }
}

run().catch((err) => {
  if (err.message === 'KEY_INVALID') {
    console.error('API key is invalid or was regenerated. Run `bunx amibroke init <new-key>` to connect.');
  } else {
    console.error('Sync error:', err.message);
  }
  process.exit(1);
});
