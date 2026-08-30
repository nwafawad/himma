/**
 * @fileoverview Auth router module.
 * 
 * Express router handling user authentication (registration, login, profile retrieval, logout).
 */

import { Router } from 'express';
import { loginInputSchema, signUpInputSchema } from '@himma/contracts';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { signup, login, getMe, logout } from './auth.controller.js';

const router = Router();

/**
 * POST /signup
 * Creates a new user account and returns JWT session.
 */
router.post('/signup', validateBody(signUpInputSchema), signup);

/**
 * POST /login
 * Authenticates user credentials and returns JWT session.
 */
router.post('/login', validateBody(loginInputSchema), login);

/**
 * GET /me
 * Returns current authenticated user and profile information.
 */
router.get('/me', requireAuth, getMe);

/**
 * POST /logout
 * Acknowledges session termination.
 */
router.post('/logout', logout);

export default router;
