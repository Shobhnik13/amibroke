import { asyncHandler } from '../middleware/async-handler';
import { getLeaderboardPage, getUserProfile, VALID_PERIODS } from '../services/leaderboard.service';
import type { Period } from '../services/leaderboard.service';

function parsePeriod(raw: unknown): Period {
  if (typeof raw === 'string' && VALID_PERIODS.has(raw as Period)) return raw as Period;
  return 'all_time';
}

export const leaderboard = asyncHandler(async (req, res) => {
  const limit  = Math.min(parseInt((req.query.limit  as string) ?? '20') || 20, 100);
  const offset = Math.max(parseInt((req.query.offset as string) ?? '0')  || 0,  0);
  const period = parsePeriod(req.query.period);

  const { rows, total } = await getLeaderboardPage(limit, offset, period);
  res.json({ leaderboard: rows, total, period });
});

export const userProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const period = parsePeriod(req.query.period);

  const result = await getUserProfile(username, period);

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
