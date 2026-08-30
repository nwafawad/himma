/**
 * @fileoverview Main API router module.
 * 
 * Aggregates and mounts all domain-specific routers onto the Express application,
 * providing authentication, profile, notes, activities, insights, uploads, and integrations.
 */

import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import uploadRoutes from '../modules/profile/avatar.routes.js';
import activitiesRoutes from '../modules/activities/activities.routes.js';
import notesRoutes from '../modules/notes/notes.routes.js';
import profileRoutes from '../modules/profile/profile.routes.js';
import insightsRoutes from '../modules/insights/insights.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import extensionRoutes from '../modules/extension/extension.routes.js';
import integrationsRoutes from '../modules/integrations/integrations.routes.js';
import importRoutes from '../modules/imports/import.routes.js';
import { markDeprecatedRoute } from '../middleware/deprecation.js';

const router = Router();

/**
 * Public Health & Diagnostic Routes
 * Unauthenticated endpoints for load balancers and uptime monitors.
 */
router.use('/health', healthRoutes);

/**
 * Authentication Routes
 * User registration, login, profile inspection, and logout.
 */
router.use('/auth', authRoutes);

/**
 * Upload & File Routes
 * User avatar and file uploads via Multer.
 */
router.use('/upload', uploadRoutes);

/**
 * Core Application Domain Routes
 * Authenticated endpoints for user profiles, notes, activity tracking, history import, and AI insights.
 */
router.use('/profile', profileRoutes);
router.use('/notes', notesRoutes);
router.use('/activities', activitiesRoutes);
router.use('/activity', markDeprecatedRoute('/api/v1/activities'), activitiesRoutes);
router.use('/import', importRoutes);
router.use('/insights', insightsRoutes);
router.use('/user', userRoutes);

/**
 * Extension & Integration Routes
 * Endpoints supporting browser extensions and external integrations.
 */
router.use('/extension', extensionRoutes);
router.use('/integrations', integrationsRoutes);

export default router;
