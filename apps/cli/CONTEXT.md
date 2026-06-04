# CLI — Complete Code Reference

## What this is

A background daemon that runs every few hours on your machine, reads token usage logs from AI coding tools (Claude Code, Codex, OpenCode), calculates the cost, and syncs aggregated records to the amibroke API. There is no server involved on your machine — it's a one-shot script scheduled by your OS.

Two entry points exist:
- `init.ts` — run once by the user to set up auth and register the daemon
- `daemon.ts` — run on a schedule by the OS, does the actual syncing

---

## Directory layout

```
src/
├── init.ts              One-time setup: validate token, detect tools, register OS daemon
├── daemon.ts            Recurring job: parse logs, aggregate, POST to API
├── types.ts             All shared TypeScript types
│
├── lib/
│   ├── aggregate.ts     In-memory Map that accumulates token counts per agent/date/model
│   ├── pricing.ts       Cost calculation from token counts + model rate table
│   ├── state.ts         Read/write auth.json and state.json to disk
│   ├── sync.ts          HTTP POST /api/sync with exponential retry
│   └── register.ts      Write OS service files (launchd on macOS, systemd on Linux)
│
└── parsers/
    ├── claude.ts        ~/.claude/projects/**/*.jsonl  — byte-offset cursor
    ├── codex.ts         ~/.codex/sessions/**/*.jsonl   — byte-offset cursor
    └── opencode.ts      ~/.local/share/opencode/opencode.db — SQLite timestamp cursor
```

---

## types.ts — shared types

```typescript
Agent = 'claude_code' | 'codex' | 'opencode'

AggregateRecord          // one row sent to the API per agent+date+model combination
  agent                  // which tool generated it
  date                   // YYYY-MM-DD
  model                  // normalized model name (no date suffix)
  input_tokens           // base input tokens
  output_tokens          // generated output tokens
  cache_read_tokens      // tokens read from prompt cache (10% cost)
  cache_write_tokens     // tokens written to prompt cache (125% cost, 5min TTL)
  cost_usd               // calculated cost as a string with 6 decimal places

Cursors                  // tracks read progress per tool — saved in state.json
  claude_code            // { [absoluteFilePath]: byteOffset }
  codex                  // { [absoluteFilePath]: byteOffset }
  opencode               // { last_timestamp: ISO string }

State                    // the full state.json structure
  cursors: Partial<Cursors>
  last_sync_at: string | null

Auth                     // the auth.json structure
  token                  // amibroke_ API key (used as Bearer token)
  api_url                // e.g. https://api.amibroke.dev
  username               // github username of the account
```

---

## init.ts — one-time setup

**Invoked by:** `bunx amibroke init <token>`

**Flow:**
1. Reads `process.argv[2]` as the API key token. Exits with usage message if missing.
2. Hits `GET /api/auth/profile` with `Authorization: Bearer <token>` to validate.
3. If 4xx → prints error and exits. The token must be an `amibroke_xxx` key from the web dashboard.
4. Calls `detectTools()` — checks if each tool's data directory exists using `existsSync`:
   - Claude Code → `~/.claude/projects/` exists?
   - Codex → `~/.codex/sessions/` exists?
   - OpenCode → `~/.local/share/opencode/opencode.db` exists?
5. Prints a color-coded detection summary to terminal using ANSI codes (green ✓ / dim –).
6. POSTs `{ agents: ['claude_code', 'codex', ...] }` to `POST /api/auth/agents` so the web dashboard can show which tools this user has.
7. Calls `saveAuth({ token, api_url, username })` → writes `~/.config/amibroke/auth.json`.
8. Calls `registerDaemon(bunPath, daemonScriptPath)` → writes OS service files.
9. Immediately imports and runs `daemon.ts` for the first sync.
10. Prints success message with profile URL.

**ANSI color codes used:**
```
\x1b[32m = green    \x1b[31m = red
\x1b[1m  = bold     \x1b[2m  = dim
\x1b[0m  = reset
```

---

## daemon.ts — recurring sync job

**Invoked by:** OS scheduler (launchd/systemd) every few hours

**Flow:**
1. `loadAuth()` — reads `~/.config/amibroke/auth.json`. If missing → exits with error (user needs to re-run init).
2. `loadState()` — reads `~/.config/amibroke/state.json`. If missing → returns empty cursors (first run).
3. `createAggMap()` — creates a fresh empty `Map<string, AggregateRecord>`.
4. Runs all three parsers **in parallel** via `Promise.all`. Each parser:
   - Reads its source (JSONL files or SQLite)
   - Calls `addToAgg()` to populate the shared map
   - Returns updated cursors reflecting how far it read
5. `aggToRecords(agg)` — converts the Map to an array.
6. If empty → `process.exit(0)` silently (nothing new).
7. `postSync(auth.token, auth.api_url, records)` — POSTs to API, retries on failure.
8. `saveState(...)` — writes updated cursors + `last_sync_at` to state.json.
9. Logs how many records were upserted.

**Error handling:**
- `KEY_INVALID` (401 from API) → prints "API key is invalid" message. Means user needs to re-run init with a new token.
- Any other error → prints the message and exits 1. The OS scheduler will retry on next interval.

---

## lib/aggregate.ts — the merge map

The aggregate map is `Map<string, AggregateRecord>` where keys are `"agent::YYYY-MM-DD::model"`.

This is why tokens from multiple sessions on the same day get merged into one DB row — all Claude Sonnet calls on 2026-06-04 become a single `claude_code::2026-06-04::claude-sonnet-4-6` record.

**`createAggMap()`** — returns a new empty Map.

**`addToAgg(map, agent, date, model, tokens)`**
- Looks up the key `agent::date::model`
- If found: adds token counts to existing record, recalculates `cost_usd` by parsing the existing string, adding the new float, and calling `.toFixed(6)`
- If not found: creates a new record with the given values
- `cost_usd` is always stored as a 6-decimal string (e.g. `"0.004231"`) to avoid float precision issues in the DB

**`aggToRecords(map)`** — `Array.from(map.values())`. Called once in daemon.ts before POSTing.

---

## lib/pricing.ts — cost calculation

**Why it exists:** Claude Code's JSONL files don't include a `costUSD` field in newer versions. We calculate cost ourselves from token counts and the model's rate.

**`normalizeModel(model)`**
Strips the 8-digit date suffix that Claude Code appends to model IDs:
```
claude-haiku-4-5-20251001  →  claude-haiku-4-5
claude-sonnet-4-6-20241022 →  claude-sonnet-4-6
gpt-5.5                    →  gpt-5.5  (unchanged, no suffix)
```
Pattern: `/-\d{8}$/`. This is applied before both storing the model name in the DB and looking up rates.

**`calcCost(model, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens)`**
Returns a number (USD). Returns `0` if model not in rate table (unknown model).

**Rate table (per 1M tokens) — sources: anthropic.com/pricing, developers.openai.com/api/docs/pricing:**

| Model | Input | Output | Cache Read | Cache Write (5min) |
|---|---|---|---|---|
| claude-opus-4-5 through 4-8 | $5 | $25 | $0.50 | $6.25 |
| claude-opus-4-1 / 4-0 | $15 | $75 | $1.50 | $18.75 |
| claude-sonnet-4-5 / 4-6 | $3 | $15 | $0.30 | $3.75 |
| claude-haiku-4-5 | $1 | $5 | $0.10 | $1.25 |
| claude-haiku-3-5 | $0.80 | $4 | $0.08 | $1.00 |
| gpt-5.5 | $5 | $30 | $0.50 | — |
| gpt-5.4 | $2.50 | $15 | $0.25 | — |
| gpt-5.4-mini | $0.75 | $4.50 | $0.075 | — |
| gpt-5.3-codex | $1.75 | $14 | $0.175 | — |
| gpt-4o | $2.50 | $10 | $1.25 | — |
| o3 | $10 | $40 | $2.50 | — |
| o4-mini | $1.10 | $4.40 | $0.275 | — |

**Cache write uses the 5-minute TTL rate** (1.25× base input). The 1-hour TTL (2× base) is not used since we can't tell from logs which was used.

---

## lib/state.ts — disk persistence

Config dir: `~/.config/amibroke/`

**`loadState()`** — synchronous read via `readFileSync`. Returns `{ cursors: {}, last_sync_at: null }` if file doesn't exist. Sync because daemon.ts calls it at startup before any async work.

**`saveState(state)`** — async write via `Bun.write`. Called at the end of a successful daemon run.

**`loadAuth()`** — synchronous read. Returns `null` if file missing.

**`saveAuth(auth)`** — creates the config dir if needed (`mkdir` from `node:fs/promises`), then writes.

**Why `readFileSync` not `Bun.file().text()`:** `Bun.file(path).toString()` returns the string `"[BunFile]"` — it doesn't read the file. `.text()` is async. `readFileSync` is the correct sync read in Bun.

---

## lib/sync.ts — HTTP POST with retry

**`postSync(token, apiUrl, records, clientVersion?)`**

POSTs `{ records, client_version }` to `${apiUrl}/api/sync` with `Authorization: Bearer ${token}`.

Retry logic:
- 3 attempts max
- Exponential backoff: 2s before attempt 2, 4s before attempt 3
- 401 → throws `Error('KEY_INVALID')` immediately, no retry (retrying won't fix auth)
- Other non-2xx → retries up to limit, then throws last error

The `token` is the `amibroke_xxx` API key. The API accepts it in the `Authorization: Bearer` header and routes it through the hash-lookup auth path (not JWT).

---

## lib/register.ts — OS daemon registration

Called once from `init.ts`. Writes service files so the OS runs daemon.ts automatically.

**macOS — launchd:**
- Writes plist to `~/Library/LaunchAgents/dev.amibroke.daemon.plist`
- `StartInterval: 10800` = every 3 hours
- `RunAtLoad: true` = also runs immediately when loaded
- Stdout + stderr both go to `~/.config/amibroke/daemon.log`
- Loaded with `launchctl load <plist>`

**Linux — systemd:**
- Writes `~/.config/systemd/user/amibroke.service` (Type=oneshot)
- Writes `~/.config/systemd/user/amibroke.timer` (OnBootSec=2min, OnUnitActiveSec=3h)
- Enabled with `systemctl --user enable --now amibroke.timer`

**`unregisterDaemon()`** — unloads/disables the service. Not currently called anywhere (future: daemon uninstall command).

---

## parsers/claude.ts — Claude Code JSONL

**Source:** `~/.claude/projects/**/*.jsonl`
**Cursor:** byte offset per absolute file path

Claude Code writes one JSON object per line per conversation turn. We only care about lines where `type === "assistant"` AND `message.model !== "<synthetic>"`.

**Synthetic entries** are injected when Claude Code compacts the conversation context (summarizes it to free up context window space). They have `model: "<synthetic>"` and all token counts are 0. We filter them out — they represent no real API cost.

**JSONL entry shape (what we read):**
```json
{
  "type": "assistant",
  "timestamp": "2026-06-04T10:00:00.000Z",
  "costUSD": 0.004231,
  "message": {
    "model": "claude-sonnet-4-6-20251001",
    "usage": {
      "input_tokens": 1200,
      "output_tokens": 340,
      "cache_read_input_tokens": 8000,
      "cache_creation_input_tokens": 500
    }
  }
}
```

**`costUSD`** — present in older Claude Code versions, absent in newer. When absent, we call `calcCost()` ourselves.

**Cursor strategy:**
```
file.slice(cursor, size).text()  →  reads only new bytes
```
`Bun.file(path).slice(start, end)` reads a byte range without loading the whole file. After processing, cursor is set to `size` (current EOF). Next run starts from there.

**Processing per entry:**
1. `normalizeModel(model)` → strips date suffix → `claude-sonnet-4-6`
2. `entry.timestamp.slice(0, 10)` → YYYY-MM-DD date
3. Extract 4 token counts
4. `calcCost(normModel, ...)` if `costUSD` absent
5. `addToAgg(agg, 'claude_code', date, normModel, tokens)`

---

## parsers/codex.ts — Codex JSONL

**Source:** `~/.codex/sessions/**/*.jsonl`
**Cursor:** byte offset per absolute file path

Codex session files are more complex than Claude's. Each file is a full session log with mixed entry types. The two we care about:

**`turn_context`** — emitted at start of each user turn, contains the model name in `payload.model`. This entry does NOT have token counts. It can appear before the cursor (from a previous run).

**`event_msg { payload.type: "token_count" }`** — emitted after each API call within a turn. Contains `payload.info.last_token_usage` with the token breakdown for that single API call.

**Why we read the full file even when cursor > 0:**
`turn_context` entries define the current model. If the cursor is in the middle of a session, we need all preceding `turn_context` entries to know which model applies to the new `token_count` entries. We read from BOF but only call `addToAgg` for lines whose byte position is >= cursor.

**Byte tracking:**
```typescript
const byteLen = Buffer.byteLength(rawLine + '\n', 'utf8');
const isNew = alreadySeen >= cursor;
alreadySeen += byteLen;
```
We use `rawLine` (not trimmed) and explicit `'utf8'` encoding. Trimming would give wrong byte counts for lines with leading whitespace.

**Token fields from `last_token_usage`:**
- `input_tokens` → base input
- `output_tokens` → generated output  
- `cached_input_tokens` → cache read (OpenAI prompt caching)
- No cache write field — OpenAI doesn't expose cache write token counts

**Cost:** Always calculated via `calcCost()` — Codex session files never include cost.

---

## parsers/opencode.ts — OpenCode SQLite

**Source:** `~/.local/share/opencode/opencode.db`
**Cursor:** ISO timestamp string of last processed message

OpenCode stores all messages in a SQLite database. The `message` table has:
- `id` — UUID
- `session_id` — which session this belongs to
- `time_created` — Unix timestamp in **milliseconds**
- `data` — JSON blob containing the full message

The JSON in `data` for assistant messages looks like:
```json
{
  "type": "assistant",
  "model": "claude-sonnet-4-6",
  "tokens": {
    "input": 1500,
    "output": 420,
    "cache": { "read": 3000, "write": 200 }
  },
  "cost": 0.00731
}
```

**Query:**
```sql
SELECT time_created, data FROM message
WHERE time_created > ?
ORDER BY time_created ASC
```
The `?` is `new Date(lastTimestamp).getTime()` in milliseconds. We only ever read rows newer than last run.

**Cursor update:** After all rows are processed, the cursor becomes `new Date(maxSeen).toISOString()` where `maxSeen` is the highest `time_created` seen.

**DB import is dynamic** (`await import('bun:sqlite')`) so the file can be imported without crashing on machines where the DB doesn't exist. The existence check `Bun.file(dbPath).exists()` happens first and returns early if the file isn't there.

**Cost:** Uses `msg.cost` if present (OpenCode calculates it), otherwise falls back to `calcCost()`.

---

## Config files on disk

```
~/.config/amibroke/
  auth.json       { token, api_url, username }
  state.json      { cursors: { claude_code, codex, opencode }, last_sync_at }
  daemon.log      stdout + stderr from every daemon run (macOS only)

~/Library/LaunchAgents/
  dev.amibroke.daemon.plist    macOS launchd service definition

~/.config/systemd/user/
  amibroke.service             Linux systemd one-shot service
  amibroke.timer               Linux systemd timer (fires every 3h)
```

---

## Full data flow — daemon run

```
daemon.ts
  │
  ├── loadAuth()
  │     reads auth.json → { token: "amibroke_xxx", api_url, username }
  │     exits if missing
  │
  ├── loadState()
  │     reads state.json → { cursors: { claude_code: {...}, codex: {...}, opencode: {...} } }
  │     returns empty cursors if file doesn't exist (first run)
  │
  ├── createAggMap()
  │     fresh Map<string, AggregateRecord>
  │
  ├── [parallel]
  │   ├── parseClaude(agg, cursors.claude_code ?? {})
  │   │     glob ~/.claude/projects/**/*.jsonl
  │   │     for each file:
  │   │       if fileSize <= cursor → skip
  │   │       read bytes[cursor..fileSize]
  │   │       for each line:
  │   │         skip if type != 'assistant' or model == '<synthetic>'
  │   │         normalizeModel() → strip date suffix
  │   │         calcCost() if no costUSD in entry
  │   │         addToAgg(agg, 'claude_code', date, normModel, tokens)
  │   │     return { [filePath]: newByteOffset }
  │   │
  │   ├── parseCodex(agg, cursors.codex ?? {})
  │   │     glob ~/.codex/sessions/**/*.jsonl
  │   │     for each file:
  │   │       if fileSize <= cursor → skip
  │   │       read FULL file (need turn_context from before cursor)
  │   │       track currentModel from turn_context entries (always)
  │   │       for lines past cursor:
  │   │         if type == 'event_msg' && payload.type == 'token_count'
  │   │           normalizeModel(currentModel)
  │   │           calcCost()
  │   │           addToAgg(agg, 'codex', date, normModel, tokens)
  │   │     return { [filePath]: newByteOffset }
  │   │
  │   └── parseOpencode(agg, cursors.opencode.last_timestamp ?? epoch)
  │         check ~/.local/share/opencode/opencode.db exists
  │         open SQLite readonly
  │         SELECT * FROM message WHERE time_created > cutoffMs
  │         for each row:
  │           parse data JSON
  │           skip if type != 'assistant'
  │           normalizeModel()
  │           calcCost() if no cost in row
  │           addToAgg(agg, 'opencode', date, normModel, tokens)
  │         return new ISO timestamp (max time_created seen)
  │
  ├── aggToRecords(agg)
  │     Map → AggregateRecord[]
  │     e.g. [
  │       { agent: 'claude_code', date: '2026-06-04', model: 'claude-sonnet-4-6',
  │         input_tokens: 45000, output_tokens: 8200, cache_read_tokens: 120000,
  │         cache_write_tokens: 9000, cost_usd: '0.412500' },
  │       ...
  │     ]
  │
  ├── if records.length === 0 → exit(0) silently
  │
  ├── postSync(auth.token, auth.api_url, records)
  │     POST /api/sync
  │     Authorization: Bearer amibroke_xxx
  │     body: { records: [...] }
  │     retries 3x with backoff on network errors
  │     throws KEY_INVALID on 401
  │
  └── saveState({ cursors: { claude_code, codex, opencode }, last_sync_at: now })
        writes ~/.config/amibroke/state.json
        next run will start from these offsets/timestamps
```

---

## Key invariants

**Cursors are only saved after a successful sync.** If the POST fails, cursors stay at their old values and the same data will be re-read next run. This means the API must be idempotent — it uses `ON CONFLICT DO UPDATE` so re-sending the same records is safe.

**Model names in the DB are always normalized.** `claude-haiku-4-5-20251001` never appears in the DB — only `claude-haiku-4-5`. This makes pricing consistent regardless of which Claude Code version wrote the log.

**Parsers share one AggMap instance.** If the same user somehow had tokens from both Claude Code and OpenCode on the same day with the same model, they'd be in different rows (different agent value in the key), not merged.

**The daemon is stateless between runs** — all state is in `state.json` on disk. Deleting `state.json` causes a full re-read of all log files on the next run.
