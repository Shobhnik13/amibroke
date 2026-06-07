import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { saveAuth } from './lib/state';

const G = '\x1b[32m'; // green
const R = '\x1b[31m'; // red
const B = '\x1b[1m';  // bold
const D = '\x1b[2m';  // dim
const X = '\x1b[0m';  // reset

const HOME = process.env.HOME!;

const TOOLS: { key: string; label: string; path: string }[] = [
  { key: 'claude_code', label: 'Claude Code', path: join(HOME, '.claude', 'projects') },
  { key: 'codex',       label: 'Codex',       path: join(HOME, '.codex', 'sessions') },
  { key: 'opencode',    label: 'OpenCode',     path: join(HOME, '.local', 'share', 'opencode', 'opencode.db') },
];

function detectTools(): { key: string; label: string }[] {
  return TOOLS.filter((t) => existsSync(t.path));
}

function printDetection(detected: { key: string; label: string }[]): void {
  const detectedKeys = new Set(detected.map((d) => d.key));
  console.log('');
  console.log(`${B}Scanning for AI coding tools...${X}`);
  console.log('');
  for (const tool of TOOLS) {
    const found = detectedKeys.has(tool.key);
    const icon = found ? `${G}✓${X}` : `${D}–${X}`;
    const name = found ? `${B}${tool.label}${X}` : `${D}${tool.label}${X}`;
    const status = found ? `${G}detected${X}` : `${D}not found${X}`;
    console.log(`  ${icon}  ${name.padEnd(20)}  ${status}`);
  }
  console.log('');

  if (detected.length === 0) {
    console.log(`${D}No tools found — install Claude Code, Codex, or OpenCode and re-run init.${X}`);
  } else {
    const names = detected.map((d) => d.label).join(', ');
    console.log(`${G}${B}Tracking ${detected.length} tool${detected.length > 1 ? 's' : ''}:${X} ${names}`);
  }
  console.log('');
}

async function init() {
  const apiUrl = process.env.AMIBROKE_API_URL ?? 'https://amibroke-api.vercel.app';
  const token = process.argv[2];

  if (!token) {
    console.error(`${R}Usage: bunx amibroke init <token>${X}`);
    console.error(`${D}Get your token at https://amibroke.dev${X}`);
    process.exit(1);
  }

  const authExists = existsSync(join(HOME, '.config', 'amibroke', 'auth.json'));
  if (authExists) {
    console.log('');
    console.log(`${G}${B}Already set up.${X}`);
    console.log(`${D}amibroke is already configured on this machine.${X}`);
    console.log('');
    console.log(`  ${D}To sync:${X}       ${B}bunx amibroke sync${X}`);
    console.log(`  ${D}To reinstall:${X}  delete ~/.config/amibroke/ and run init again`);
    console.log('');
    process.exit(0);
  }

  process.stdout.write(`Validating token${D}...${X}`);

  const res = await fetch(`${apiUrl}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error(`\n${R}Invalid token.${X} Please log in at ${B}https://amibroke.dev${X} and copy your token from the dashboard.`);
    process.exit(1);
  }

  const { user } = await res.json() as { user: { username: string } };
  console.log(` ${G}✓${X} logged in as ${B}@${user.username}${X}`);

  // Detect tools
  const detected = detectTools();
  printDetection(detected);

  // Store detected agents on the server
  await fetch(`${apiUrl}/api/auth/agents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ agents: detected.map((d) => d.key) }),
  });

  await saveAuth({ token, api_url: apiUrl, username: user.username });

  console.log(`\nRunning first sync${D}...${X}`);
  await import('./sync');

  console.log(`\n${G}${B}All set!${X} View your stats at ${B}https://amibroke.dev/${user.username}${X}`);
  console.log(`${D}Run ${X}${B}bunx amibroke sync${X}${D} anytime to update your stats.${X}`);
}

init().catch((err) => {
  console.error(`\n${R}Error:${X}`, err.message);
  process.exit(1);
});
