/**
 * @fileoverview Third-party integrations router module.
 * 
 * Express router managing external OAuth integration flows (e.g. initiating authorization,
 * handling callbacks) and triggering synchronization for external services.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { oauthProviderParamSchema, syncIntegrationSchema } from './integrations.schema.js';
import {
  initiateOAuth,
  handleOAuthCallback,
  triggerSync,
} from './integrations.controller.js';

const router = Router();

// Apply authentication middleware to all integration routes
router.use(requireAuth);

/**
 * GET /oauth/:provider
 * Initiates the OAuth flow for a specific integration provider (e.g., github, google).
 * Validates provider route parameter against `oauthProviderParamSchema`.
 */
router.get('/oauth/:provider', validateParams(oauthProviderParamSchema), initiateOAuth);

/**
 * GET /oauth/:provider/callback
 * Handles OAuth callback redirect from an external provider after user authorization.
 * Validates provider route parameter against `oauthProviderParamSchema`.
 */
router.get('/oauth/:provider/callback', validateParams(oauthProviderParamSchema), handleOAuthCallback);

/**
 * POST /sync
 * Triggers data synchronization for an active integration.
 * Validates request body against `syncIntegrationSchema`.
 */
router.post('/sync', validateBody(syncIntegrationSchema), triggerSync);

export default router;
