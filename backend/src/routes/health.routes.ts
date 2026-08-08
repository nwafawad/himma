/**
 * @fileoverview Health check router module.
 * 
 * Express router serving unauthenticated system status and database connectivity checks.
 */

import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = Router();

/**
 * GET /
 * Performs a service health check verifying server uptime and PostgreSQL connection status.
 */
router.get('/', getHealth);

export default router;

