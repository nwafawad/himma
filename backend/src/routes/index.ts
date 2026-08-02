import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// API Version 1 Routes
router.use('/health', healthRoutes);

export default router;
