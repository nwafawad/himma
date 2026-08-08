/**
 * @file profile.controller.ts
 * @description HTTP route handlers for managing user skills and goals profile (SkillsGoalsProfile).
 */

import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service.js';

/**
 * Handles GET `/api/profile` request to fetch the authenticated user's skills & goals profile.
 *
 * @param req - Express Request object containing authenticated `req.user`.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const profile = await profileService.getProfileByUserId(userId);
    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Skills & goals profile has not been created yet.',
      });
    }
    return res.json({ data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PUT `/api/profile` request to create or update (upsert) the authenticated user's skills & goals profile.
 *
 * @param req - Express Request object containing authenticated `req.user` and profile update payload in request body.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const upsertProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const profile = await profileService.upsertProfileByUserId(userId, req.body);
    return res.json({ data: profile });
  } catch (error) {
    next(error);
  }
};

