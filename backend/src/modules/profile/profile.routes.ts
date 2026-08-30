/**
 * @fileoverview User profile router module.
 * 
 * Express router serving user profile operations (retrieval and upsert).
 * All routes require authentication via `requireAuth`.
 */

import { Router } from 'express';
import { upsertProfileInputSchema } from '@himma/contracts';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { getProfile, upsertProfile } from './profile.controller.js';

const router = Router();

// Apply authentication middleware to all profile routes
router.use(requireAuth);

/**
 * GET /
 * Fetches the user profile for the authenticated user.
 */
router.get('/', getProfile);

/**
 * PUT /
 * Creates or updates (upserts) the authenticated user's profile.
 * Validates request body against `upsertProfileSchema`.
 */
router.put('/', validateBody(upsertProfileInputSchema), upsertProfile);

export default router;
