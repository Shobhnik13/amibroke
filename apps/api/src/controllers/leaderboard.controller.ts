import { asyncHandler } from '../middleware/async-handler';
import { getLeaderboardPage, getUserProfile } from '../services/leaderboard.service';

export const leaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? '20') || 20, 100);
  const offset = Math.max(parseInt((req.query.offset as string) ?? '0') || 0, 0);

  const rows = await getLeaderboardPage(limit, offset);
  res.json({ leaderboard: rows });
});

export const userProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const result = await getUserProfile(username);

  if (!result) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  if ('private' in result) {
    res.status(403).json({ error: 'This profile is private' });
    return;
  }

  res.json(result);
});
