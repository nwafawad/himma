import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { createInsightRunSchema } from '../validators/insights.schema.js';
import { idParamSchema } from '../validators/notes.schema.js';
import {
  getInsightRuns,
  createInsightRun,
  getInsightRunById,
} from '../controllers/insights.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getInsightRuns);
router.post('/', validateBody(createInsightRunSchema), createInsightRun);
router.get('/:id', validateParams(idParamSchema), getInsightRunById);

export default router;
