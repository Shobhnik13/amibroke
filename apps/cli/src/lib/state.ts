import { join } from 'path';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import type { State, Auth } from '../types';

const CONFIG_DIR = join(process.env.HOME!, '.config', 'amibroke');
const STATE_PATH = join(CONFIG_DIR, 'state.json');
const AUTH_PATH = join(CONFIG_DIR, 'auth.json');

export function loadState(): State {
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { cursors: {}, last_sync_at: null };
  }
}

export async function saveState(state: State): Promise<void> {
  await Bun.write(STATE_PATH, JSON.stringify(state, null, 2));
}

export function loadAuth(): Auth | null {
  try {
    return JSON.parse(readFileSync(AUTH_PATH, 'utf8'));
  } catch {
    return null;
  }
}

export async function saveAuth(auth: Auth): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(AUTH_PATH, JSON.stringify(auth, null, 2));
}
