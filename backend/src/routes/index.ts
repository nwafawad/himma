import { Router } from 'express';
import healthRoutes from './health.routes.js';
import activitiesRoutes from './activities.routes.js';
import notesRoutes from './notes.routes.js';
import profileRoutes from './profile.routes.js';
import insightsRoutes from './insights.routes.js';

const router = Router();

// API Version 1 Routes
router.use('/health', healthRoutes);
router.use('/activities', activitiesRoutes);
router.use('/notes', notesRoutes);
router.use('/profile', profileRoutes);
router.use('/insights', insightsRoutes);

export default router;
