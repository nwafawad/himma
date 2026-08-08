/**
 * @fileoverview Extension router module.
 * 
 * Express router handling client browser extension communication, including domain activity
 * tracking and user allowlist configuration retrieval. All routes require authentication.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trackDomainSchema } from '../validators/extension.schema.js';
import { trackDomain, getAllowlist } from '../controllers/extension.controller.js';

const router = Router();

// Apply authentication middleware to all extension routes
router.use(requireAuth);

/**
 * POST /track
 * Logs or updates domain browsing activity reported by the browser extension.
 * Validates request body against `trackDomainSchema`.
 */
router.post('/track', validateBody(trackDomainSchema), trackDomain);

/**
 * GET /allowlist
 * Retrieves the domain allowlist configuration for the user's browser extension.
 */
router.get('/allowlist', getAllowlist);

export default router;

