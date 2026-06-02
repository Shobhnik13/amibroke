import {
  getGitHubOAuthUrl,
  exchangeCodeForToken,
  getGitHubUser,
  initiateDeviceFlow,
  pollDeviceFlow,
} from '../lib/github';
import type { GitHubUser } from '../lib/github';
import { signToken } from '../lib/jwt';
import { upsertUserByGithub, findUserById } from '../repositories/user.repository';
import { sumCostByUserId } from '../repositories/usage-record.repository';
import { getLastSync } from '../repositories/sync-log.repository';

export function getOAuthUrl(): string {
  return getGitHubOAuthUrl();
}

export async function completeWebAuth(code: string): Promise<{ token: string }> {
  const accessToken = await exchangeCodeForToken(code);
  const ghUser = await getGitHubUser(accessToken);
  const user = await upsertGitHubUser(ghUser);
  const token = signToken({ sub: user.id, username: user.username });
  return { token };
}

export async function initiateDevice() {
  return initiateDeviceFlow();
}

export type DevicePollResult =
  | { status: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied' | string }
  | { status: 'complete'; token: string };

export async function pollDevice(deviceCode: string): Promise<DevicePollResult> {
  const result = await pollDeviceFlow(deviceCode);

  if (!result.access_token) {
    return { status: result.error ?? 'authorization_pending' };
  }

  const ghUser = await getGitHubUser(result.access_token);
  const user = await upsertGitHubUser(ghUser);
  const token = signToken({ sub: user.id, username: user.username });

  return { status: 'complete', token };
}

export async function getProfile(userId: string) {
  const user = await findUserById(userId);
  if (!user) return null;

  const [lastSync, totalCostUsd] = await Promise.all([
    getLastSync(userId),
    sumCostByUserId(userId),
  ]);

  return {
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isPublic: user.isPublic,
      createdAt: user.createdAt,
    },
    daemon: resolveDaemonStatus(user.daemonStatus, lastSync?.syncedAt ?? null),
    totalCostUsd,
  };
}

type DaemonStatus = 'never_installed' | 'active' | 'stale' | 'inactive' | 'stopped' | 'uninstalled';

function resolveDaemonStatus(
  storedStatus: string | null,
  lastSyncAt: Date | null,
): { status: DaemonStatus; lastSyncAt: Date | null; message: string } {
  if (storedStatus === 'uninstalled') {
    return { status: 'uninstalled', lastSyncAt, message: 'Daemon was uninstalled. Run `bunx amibroke init` to reinstall.' };
  }
  if (storedStatus === 'stopped') {
    return { status: 'stopped', lastSyncAt, message: 'Daemon was stopped. Run `bunx amibroke init` to restart.' };
  }
  if (!lastSyncAt) {
    return { status: 'never_installed', lastSyncAt: null, message: 'No daemon detected. Run `bunx amibroke init` to start tracking.' };
  }

  const hoursSince = (Date.now() - lastSyncAt.getTime()) / 3_600_000;

  if (hoursSince < 12) return { status: 'active', lastSyncAt, message: 'Tracking active.' };
  if (hoursSince < 48) return { status: 'stale', lastSyncAt, message: 'Daemon may have stopped — no sync in over 12 hours.' };
  return { status: 'inactive', lastSyncAt, message: 'Daemon appears offline. Run `bunx amibroke init` to restart.' };
}

async function upsertGitHubUser(ghUser: GitHubUser) {
  return upsertUserByGithub({
    githubId: ghUser.id,
    username: ghUser.login,
    avatarUrl: ghUser.avatar_url,
    email: ghUser.email,
  });
}
