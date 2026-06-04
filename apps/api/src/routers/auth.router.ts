import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { githubRedirect, githubCallback, logout, profile, generateKey, detectedAgents } from '../controllers/auth.controller';

const router = Router();

router.get('/github', githubRedirect);
router.get('/github/callback', githubCallback);
router.post('/logout', logout);
router.get('/profile', requireAuth, profile);
router.post('/key', requireAuth, generateKey);
router.post('/agents', requireAuth, detectedAgents);

export default router;
