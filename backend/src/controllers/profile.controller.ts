import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service.js';

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

export const upsertProfile = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const profile = await profileService.upsertProfileByUserId(userId, req.body);
    return res.json({ data: profile });
  } catch (error) {
    next(error);
  }
};
