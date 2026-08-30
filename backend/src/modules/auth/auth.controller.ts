/**
 * @file auth.controller.ts
 * @description HTTP route handlers for user registration, authentication, session validation, and logout.
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';

/**
 * Handles POST `/api/auth/signup` to register a new user.
 */
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await authService.registerUser(req.body);
    return res.status(201).json({
      data: session,
      message: 'Account created successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST `/api/auth/login` to authenticate an existing user.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await authService.loginUser(req.body);
    return res.status(200).json({
      data: session,
      message: 'Authentication successful.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET `/api/auth/me` to fetch current authenticated user profile.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const user = await authService.getCurrentUser(userId);
    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST `/api/auth/logout` to acknowledge session termination.
 */
export const logout = async (_req: Request, res: Response) => {
  return res.status(200).json({
    message: 'Successfully signed out.',
  });
};
