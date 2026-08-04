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

// Rate limiter for expensive AI insight generation (10 runs per 15 mins per user)
const generateInsightLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many insight generation requests. Please wait before generating another report.',
});

router.use(requireAuth);

router.get('/', getInsightRuns);
router.post('/', validateBody(createInsightRunSchema), createInsightRun);
router.post('/generate', generateInsightLimiter, generateInsight);
router.get('/:id', validateParams(idParamSchema), getInsightRunById);
router.post('/:id/feedback', validateParams(idParamSchema), validateBody(feedbackSchema), postFeedback);

export default router;
