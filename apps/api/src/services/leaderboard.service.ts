import { findUserByUsername } from '../repositories/user.repository';
import { getLeaderboard, getUserBreakdown } from '../repositories/usage-record.repository';

export async function getLeaderboardPage(limit: number, offset: number) {
  return getLeaderboard(limit, offset);
}

export async function getUserProfile(username: string) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  if (!user.isPublic) return { private: true as const };

  const breakdown = await getUserBreakdown(user.id);
  return {
    user: { username: user.username, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
    breakdown,
  };
}
