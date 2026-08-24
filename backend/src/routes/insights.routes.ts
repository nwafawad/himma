/**
 * @fileoverview Insights router module.
 * 
 * Express router handling AI-generated learning insights, insight run history, manually
 * triggering new AI report generation, and submitting user feedback on specific insights.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/security.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { createInsightRunSchema } from '../validators/insights.schema.js';
import { feedbackSchema } from '../validators/feedback.schema.js';
import { idParamSchema } from '../validators/notes.schema.js';
import {
  getInsightRuns,
  createInsightRun,
  getInsightRunById,
  generateInsight,
  postFeedback,
} from '../controllers/insights.controller.js';

const router = Router();

/**
 * Rate limiter middleware for expensive AI insight generation calls.
 * Limits generation triggers to 10 requests per 15-minute window.
 */
const generateInsightLimiter = createRateLimiter({
  scope: 'insights.generate',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many insight generation requests. Please wait before generating another report.',
});

// Apply authentication middleware to all insight routes
router.use(requireAuth);

/**
 * GET /
 * Fetches existing insight runs for the authenticated user.
 */
router.get('/', getInsightRuns);

/**
 * POST /
 * Creates a record for an insight run.
 * Validates request body against `createInsightRunSchema`.
 */
router.post('/', validateBody(createInsightRunSchema), createInsightRun);

/**
 * POST /generate
 * Triggers an AI insight generation workflow.
 * Rate limited via `generateInsightLimiter`.
 */
router.post('/generate', generateInsightLimiter, generateInsight);

/**
 * GET /:id
 * Retrieves details of a specific insight run by its UUID.
 * Validates route parameter against `idParamSchema`.
 */
router.get('/:id', validateParams(idParamSchema), getInsightRunById);

/**
 * POST /:id/feedback
 * Submits user feedback (rating/comment) for a specific insight run.
 * Validates route parameter against `idParamSchema` and request body against `feedbackSchema`.
 */
router.post('/:id/feedback', validateParams(idParamSchema), validateBody(feedbackSchema), postFeedback);

export default router;
