# amigmi

Track your AI coding tool spend and compete on the global leaderboard.

→ [amigmi.xyz](https://amigmi.xyz)

## Monorepo structure

```
apps/
  frontend/   Next.js 15 web app
  cli/        Bun CLI published as `amigmi` on npm
```

API lives in a separate repo: `amigmi-api`

## Stack

- **Frontend**: Next.js 15 App Router, deployed on Vercel
- **CLI**: Bun, published to npm as `amigmi`
- **API**: Express + Bun, Neon Postgres, deployed at `api.amigmi.xyz`

## Local dev

```bash
bun install

# frontend
bun run dev:web        # http://localhost:3000

# cli
bun run apps/cli/src/index.ts
```

## CLI usage

```bash
bunx amigmi init <token>   # authenticate
bunx amigmi sync           # push usage data
bunx amigmi help           # show help
```

## Supported tools

- Claude Code
- Codex  
- OpenCode
- More coming soon

## Deploy

- **Frontend**: push to `main` → Vercel auto-deploys
- **CLI**: `cd apps/cli && npm publish`
