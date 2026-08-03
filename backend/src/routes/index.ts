import { Router } from 'express';
import healthRoutes from './health.routes.js';
import activitiesRoutes from './activities.routes.js';
import notesRoutes from './notes.routes.js';
import profileRoutes from './profile.routes.js';
import insightsRoutes from './insights.routes.js';
import userRoutes from './user.routes.js';
import extensionRoutes from './extension.routes.js';
import integrationsRoutes from './integrations.routes.js';

const router = Router();

// Public Health Route
router.use('/health', healthRoutes);

// Modular Domain Routes (supporting /api & /api/v1)
router.use('/profile', profileRoutes);
router.use('/notes', notesRoutes);
router.use('/activity', activitiesRoutes);
router.use('/activities', activitiesRoutes);
router.use('/insights', insightsRoutes);
router.use('/user', userRoutes);

// Future Phase Architecture Routes
router.use('/extension', extensionRoutes);
router.use('/integrations', integrationsRoutes);

export default router;
