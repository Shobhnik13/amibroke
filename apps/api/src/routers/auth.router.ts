import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { githubRedirect, githubCallback, logout, deviceInit, devicePoll, profile } from '../controllers/auth.controller';

const router = Router();

router.get('/github', githubRedirect);
router.get('/github/callback', githubCallback);
router.post('/logout', logout);
router.post('/device/init', deviceInit);
router.post('/device/poll', devicePoll);

router.get('/profile', requireAuth, profile);

export default router;
