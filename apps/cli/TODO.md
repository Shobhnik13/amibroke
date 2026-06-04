# CLI TODO

## Pending: Stop & Uninstall flows

### Commands to build

**`bunx amibroke stop`**
- Call `POST /api/sync/unregister { reason: 'stopped' }` to tell the API
- Unload the OS service (launchd on mac, systemd on linux)
- Keep `auth.json` and `state.json` intact so cursors are preserved
- Print instructions to restart

**`bunx amibroke uninstall`**
- Call `POST /api/sync/unregister { reason: 'uninstalled' }` to tell the API
- Unload and delete OS service files (plist on mac, .service + .timer on linux)
- Delete `~/.config/amibroke/auth.json`, `state.json`, `daemon.log`
- Print confirmation

**`bunx amibroke sync`** (manual trigger)
- Just runs the daemon logic once manually
- Useful for "sync now" from terminal

### Entry point refactor needed
- Create `src/cli.ts` as the new bin entry that routes subcommands
- Update `package.json` bin from `./src/init.ts` → `./src/cli.ts`
- Update `init.ts` to read `argv[3]` for token (since `argv[2]` becomes `"init"`)

### Cursor IDE parser
- Find where Cursor stores AI usage logs on disk (needs investigation — not publicly documented)
- Likely at `~/Library/Application Support/Cursor/` on mac or `~/.config/Cursor/` on linux
- Once format is known: add `src/parsers/cursor.ts`, add `cursor` to `Agent` type, wire into `daemon.ts` and `types.ts`
- Add `cursor` to tool detection in `init.ts`

