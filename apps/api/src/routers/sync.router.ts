import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { sync, unregister } from '../controllers/sync.controller';

const router = Router();

router.post('/', requireAuth, sync);
router.post('/unregister', requireAuth, unregister);

export default router;
