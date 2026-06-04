import { findUserByUsername } from '../repositories/user.repository';
import { getLeaderboard, getUserBreakdown } from '../repositories/usage-record.repository';

export type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

export const VALID_PERIODS = new Set<Period>(['daily', 'weekly', 'monthly', 'all_time']);

export async function getLeaderboardPage(limit: number, offset: number, period: Period) {
  return getLeaderboard(limit, offset, period);
}

export async function getUserProfile(username: string, period: Period) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  if (!user.isPublic) return { private: true as const };

  const breakdown = await getUserBreakdown(user.id, period);
  return {
    user: { username: user.username, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
    breakdown,
    period,
  };
}
