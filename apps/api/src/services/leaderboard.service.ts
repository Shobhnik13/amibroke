import { findUserByUsername } from '../repositories/user.repository';
import { getLeaderboard, getLeaderboardCount, getUserBreakdown } from '../repositories/usage-record.repository';

export type Period = 'daily' | 'weekly' | 'monthly' | 'all_time';

export const VALID_PERIODS = new Set<Period>(['daily', 'weekly', 'monthly', 'all_time']);

export async function getLeaderboardPage(limit: number, offset: number, period: Period) {
  const [rows, total] = await Promise.all([
    getLeaderboard(limit, offset, period),
    getLeaderboardCount(period),
  ]);
  return { rows, total };
}

export async function getUserProfile(username: string, period: Period) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  if (!user.isPublic) return { private: true as const };

  const breakdown = await getUserBreakdown(user.id, period);
  return {
    user: { username: user.username, avatarUrl: user.avatarUrl, publicTheme: user.publicTheme ?? 'noir', createdAt: user.createdAt },
    breakdown,
    period,
  };
}
