import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
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

router.use(requireAuth);

router.get('/', getInsightRuns);
router.post('/', validateBody(createInsightRunSchema), createInsightRun);
router.post('/generate', generateInsight);
router.get('/:id', validateParams(idParamSchema), getInsightRunById);
router.post('/:id/feedback', validateParams(idParamSchema), validateBody(feedbackSchema), postFeedback);

export default router;
