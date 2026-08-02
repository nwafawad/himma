import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  getInsightRuns,
  createInsightRun,
  getInsightRunById,
} from '../controllers/insights.controller.js';

const router = Router();

router.use(authenticateUser);

router.get('/', getInsightRuns);
router.post('/', createInsightRun);
router.get('/:id', getInsightRunById);

export default router;
