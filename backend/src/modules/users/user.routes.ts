/**
 * @fileoverview User account and lifecycle management router module.
 * 
 * Express router handling user data exports (GDPR compliance) and account deletion requests.
 * All routes require authentication via `requireAuth`.
 */

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { exportUserData, deleteAccount } from './user.controller.js';

const router = Router();

// Apply authentication middleware to all user management routes
router.use(requireAuth);

/**
 * GET /export
 * Exports all data associated with the authenticated user (data portability/GDPR).
 */
router.get('/export', exportUserData);

/**
 * DELETE /account
 * Permanently deletes the authenticated user's account and all related data.
 */
router.delete('/account', deleteAccount);

export default router;
