import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = Router();

// GET /health and /api/v1/health
router.get('/', getHealth);

export default router;
