import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trackDomainSchema } from '../validators/extension.schema.js';
import { trackDomain, getAllowlist } from '../controllers/extension.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/track', validateBody(trackDomainSchema), trackDomain);
router.get('/allowlist', getAllowlist);

export default router;
