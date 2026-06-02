import { Router } from 'express';
import { leaderboard, userProfile } from '../controllers/leaderboard.controller';

const router = Router();

router.get('/', leaderboard);
router.get('/users/:username', userProfile);

export default router;
