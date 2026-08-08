/**
 * @fileoverview Activities router module.
 * 
 * Defines HTTP endpoints for managing user activity records. All routes in this module
 * require authentication via the `requireAuth` middleware.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { createActivitySchema, updateActivitySchema } from '../validators/activities.schema.js';
import { idParamSchema } from '../validators/notes.schema.js';
import {
  getActivities,
  createActivity,
  getActivityById,
  updateActivity,
  deleteActivity,
} from '../controllers/activities.controller.js';

const router = Router();

// Apply authentication middleware to all activity routes
router.use(requireAuth);

/**
 * GET /
 * Retrieves a list of activities for the authenticated user.
 */
router.get('/', getActivities);

/**
 * POST /
 * Creates a new activity record.
 * Validates the request body against `createActivitySchema`.
 */
router.post('/', validateBody(createActivitySchema), createActivity);

/**
 * GET /:id
 * Retrieves a specific activity by its UUID.
 * Validates the route parameter against `idParamSchema`.
 */
router.get('/:id', validateParams(idParamSchema), getActivityById);

/**
 * PUT /:id
 * Updates an existing activity by its UUID.
 * Validates the route parameter against `idParamSchema` and request body against `updateActivitySchema`.
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateActivitySchema), updateActivity);

/**
 * DELETE /:id
 * Deletes an activity record by its UUID.
 * Validates the route parameter against `idParamSchema`.
 */
router.delete('/:id', validateParams(idParamSchema), deleteActivity);

export default router;

