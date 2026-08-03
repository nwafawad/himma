import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { oauthProviderParamSchema, syncIntegrationSchema } from '../validators/integrations.schema.js';
import {
  initiateOAuth,
  handleOAuthCallback,
  triggerSync,
} from '../controllers/integrations.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/oauth/:provider', validateParams(oauthProviderParamSchema), initiateOAuth);
router.get('/oauth/:provider/callback', validateParams(oauthProviderParamSchema), handleOAuthCallback);
router.post('/sync', validateBody(syncIntegrationSchema), triggerSync);

export default router;
