# API Architecture

## High-level overview

REST API built with **Bun + Express + TypeScript**. Database is **Neon PostgreSQL** accessed via **Drizzle ORM**. Auth uses **GitHub OAuth** (web) and **GitHub Device Flow** (CLI). JWTs are issued for both flows and verified on every protected route.

```
HTTP Request
    │
    ▼
 Router          — maps URL + method to a controller function
    │
    ▼
 Middleware       — auth check (JWT), async error wrapper
    │
    ▼
 Controller       — validates input, calls service, writes HTTP response
    │
    ▼
 Service          — business logic, orchestrates repository calls
    │
    ▼
 Repository       — raw Drizzle queries, nothing else
    │
    ▼
 Neon PostgreSQL
```

Errors thrown anywhere in the chain are caught by `asyncHandler` and forwarded to Express's global error handler in `server.ts`. No try-catch in controllers.

---

## Entry point

### `src/server.ts`
Bootstraps the Express app. Registers global middleware (CORS, JSON body parser, cookie parser), mounts all routers under `/api/*`, and registers the 404 + global error handler. This is the only file that calls `app.listen`.

---

## Routers `src/routers/`

Thin files. Each router maps HTTP method + path to a controller function. No logic here.

| File | Prefix | Routes |
|---|---|---|
| `auth.router.ts` | `/api/auth` | GitHub OAuth redirect/callback, device flow init/poll, logout |
| `me.router.ts` | `/api/me` | Get current user dashboard, update agents, toggle tracking |
| `sync.router.ts` | `/api/sync` | Receive daemon payload, daemon unregister |
| `leaderboard.router.ts` | `/api/leaderboard` | Public leaderboard, public user profile |

---

## Controllers `src/controllers/`

Handle the HTTP boundary. Responsibilities: read from `req`, validate input with Zod where needed, call one service function, write to `res`. All async controllers are wrapped with `asyncHandler` — no try-catch.

| File | What it does |
|---|---|
| `auth.controller.ts` | Handles GitHub OAuth redirect/callback and device flow polling. Sets JWT cookie on web login, returns JWT in body for CLI. |
| `me.controller.ts` | Returns the current user's dashboard (user info + daemon status + agents + total cost). Handles agent config and tracking toggle updates. |
| `sync.controller.ts` | Validates the daemon's sync payload with Zod (up to 5000 records). Calls `processSync`. Returns `tracking_enabled` flag so daemon knows whether to continue. |
| `leaderboard.controller.ts` | Returns paginated public leaderboard. Returns a single user's public breakdown by agent and model. |

---

## Middleware `src/middleware/`

| File | What it does |
|---|---|
| `auth.ts` | `requireAuth` — extracts JWT from cookie or `Authorization` header, verifies it, attaches `req.user` payload. Returns 401 if missing or invalid. |
| `async-handler.ts` | `asyncHandler(fn)` — wraps an async route handler and forwards any thrown error to Express's next(err), hitting the global error handler in server.ts. |

---

## Services `src/services/`

Business logic layer. Services do not touch `req`/`res`. They call repositories, apply logic, and return plain objects.

| File | What it does |
|---|---|
| `auth.service.ts` | `upsertUser` — takes a GitHub user object, delegates to the user repository. Single function. |
| `me.service.ts` | `getUserDashboard` — fetches user, last sync, agents, and total cost in parallel. `resolveDaemonStatus` — computes daemon health from stored status + last sync timestamp: `never_installed → active → stale → inactive → stopped → uninstalled → paused`. |
| `sync.service.ts` | `processSync` — checks tracking is enabled, calls batch upsert, writes sync log, updates daemon status to active. Returns `tracking_enabled: false` if user has paused tracking, so the daemon stops sending. `unregisterDaemon` — marks daemon as stopped or uninstalled. |
| `leaderboard.service.ts` | `getLeaderboardPage` and `getUserProfile` — thin wrappers around repository calls. Handles the private profile guard. |

---

## Repositories `src/repositories/`

One responsibility: Drizzle queries. No business logic, no HTTP concerns. Called only by services.

| File | What it does |
|---|---|
| `user.repository.ts` | Find by id, find by username, upsert by GitHub id (on conflict update profile fields), update daemon status, update tracking enabled. |
| `agent-config.repository.ts` | Find all configs for a user, upsert a single agent config (enabled/disabled). |
| `usage-record.repository.ts` | Batch upsert in chunks of 200 using `EXCLUDED.*` for conflict resolution. Sum cost by user. Leaderboard aggregation query. Per-user breakdown query grouped by agent + model. |
| `sync-log.repository.ts` | Get latest sync log for a user (used to compute daemon staleness). Insert a new sync log entry. |

---

## Lib `src/lib/`

| File | What it does |
|---|---|
| `github.ts` | GitHub API helpers: build OAuth URL, exchange code for token, fetch GitHub user, initiate device flow, poll device flow. Pure functions, no state. |
| `jwt.ts` | `signToken` and `verifyToken` using `jsonwebtoken`. 90-day expiry. Reads `JWT_SECRET` from env. |

---

## Database package `packages/db/`

Shared across the monorepo (currently only used by the API).

| File | What it does |
|---|---|
| `src/schema/enums.ts` | Postgres enums: `agent` (claude_code, opencode, codex, gemini) and `daemon_status` (active, stopped, uninstalled). |
| `src/schema/users.ts` | Users table. Stores GitHub profile, tracking preferences, daemon status, and last sync timestamp. |
| `src/schema/agent-configs.ts` | Per-user agent enable/disable config. Unique on (user_id, agent). |
| `src/schema/usage-records.ts` | Core data table. One row per (user, agent, date, model). Upserted by the daemon on every sync. Has an index on (user_id, date) for leaderboard queries. |
| `src/schema/sync-logs.ts` | Audit log of every daemon sync: which agents, how many records, client version. Used to determine daemon staleness. |
| `src/client.ts` | Singleton `getDb()` — creates the Drizzle client on first call, reuses it after. Imports each schema file individually. |
| `src/migrate.ts` | One-shot migration runner. Run with `bun db:migrate`. |
| `drizzle.config.ts` | Points Drizzle Kit at `src/schema/*.ts` for migration generation. |

---

## Daemon status lifecycle

```
never_installed   no sync logs exist for this user
      │
      │  daemon syncs for the first time
      ▼
   active          last sync < 12 hours ago
      │
      │  no sync for 12–48 hours
      ▼
   stale           daemon may have stopped
      │
      │  no sync for > 48 hours
      ▼
  inactive         daemon is definitely offline
      │
      │  daemon calls POST /api/sync/unregister
      ▼
stopped / uninstalled

   paused          user toggled tracking off from the web dashboard
                   (daemon receives tracking_enabled: false and stops)
```
