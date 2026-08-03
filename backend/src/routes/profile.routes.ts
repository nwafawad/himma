import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { upsertProfileSchema } from '../validators/profile.schema.js';
import { getProfile, upsertProfile } from '../controllers/profile.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getProfile);
router.put('/', validateBody(upsertProfileSchema), upsertProfile);

export default router;
