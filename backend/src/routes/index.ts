/**
 * @fileoverview Main API router module.
 * 
 * Aggregates and mounts all domain-specific routers onto the Express application,
 * providing both core application routes and future phase extension/integration endpoints.
 */

import { Router } from 'express';
import healthRoutes from './health.routes.js';
import activitiesRoutes from './activities.routes.js';
import notesRoutes from './notes.routes.js';
import profileRoutes from './profile.routes.js';
import insightsRoutes from './insights.routes.js';
import userRoutes from './user.routes.js';
import extensionRoutes from './extension.routes.js';
import integrationsRoutes from './integrations.routes.js';
import importRoutes from './import.routes.js';

const router = Router();

/**
 * Public Health & Diagnostic Routes
 * Unauthenticated endpoints for load balancers and uptime monitors.
 */
router.use('/health', healthRoutes);

/**
 * Core Application Domain Routes
 * Authenticated endpoints for user profiles, notes, activity tracking, history import, and AI insights.
 */
router.use('/profile', profileRoutes);
router.use('/notes', notesRoutes);
router.use('/activity', activitiesRoutes);
router.use('/activities', activitiesRoutes);
router.use('/import', importRoutes);
router.use('/insights', insightsRoutes);
router.use('/user', userRoutes);

/**
 * Extension & Integration Routes
 * Endpoints supporting browser extensions and external OAuth integrations.
 */
router.use('/extension', extensionRoutes);
router.use('/integrations', integrationsRoutes);

export default router;

