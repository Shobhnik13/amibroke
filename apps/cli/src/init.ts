import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { saveAuth } from './lib/state';

const G = '\x1b[32m'; // green
const R = '\x1b[31m'; // red
const B = '\x1b[1m';  // bold
const D = '\x1b[2m';  // dim
const X = '\x1b[0m';  // reset

const HOME = process.env.HOME!;

async function init() {
  const apiUrl = 'https://api.amigmi.xyz';
  const token = process.argv[3];

  if (!token) {
    console.error(`${R}Usage: bunx amigmi init <token>${X}`);
    console.error(`${D}Get your token at https://amigmi.xyz${X}`);
    process.exit(1);
  }

  const authExists = existsSync(join(HOME, '.config', 'amigmi', 'auth.json'));
  if (authExists) {
    console.log('');
    console.log(`${G}${B}Already set up.${X}`);
    console.log(`${D}amigmi is already configured on this machine.${X}`);
    console.log('');
    console.log(`  ${D}To sync:${X}       ${B}bunx amigmi sync${X}`);
    console.log(`  ${D}To reinstall:${X}  delete ~/.config/amigmi/ and run init again`);
    console.log('');
    process.exit(0);
  }

  process.stdout.write(`Validating token${D}...${X}`);

  const res = await fetch(`${apiUrl}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error(`\n${R}Invalid token.${X} Please log in at ${B}https://amigmi.xyz${X} and copy your token from the dashboard.`);
    process.exit(1);
  }

  const { user } = await res.json() as { user: { username: string } };
  console.log(` ${G}✓${X} logged in as ${B}@${user.username}${X}`);

  await saveAuth({ token, api_url: apiUrl, username: user.username });

  console.log(`\nRunning first sync${D}...${X}`);
  await import('./sync');

  console.log(`\n${G}${B}All set!${X} View your stats at ${B}https://amigmi.xyz/${user.username}${X}`);
  console.log(`${D}Run ${X}${B}bunx amigmi sync${X}${D} anytime to update your stats.${X}`);
}

init().catch((err) => {
  console.error(`\n${R}Error:${X}`, err.message);
  process.exit(1);
});
