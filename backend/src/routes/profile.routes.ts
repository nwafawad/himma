import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { getProfile, upsertProfile } from '../controllers/profile.controller.js';

const router = Router();

router.use(authenticateUser);

router.get('/', getProfile);
router.put('/', upsertProfile);

export default router;
