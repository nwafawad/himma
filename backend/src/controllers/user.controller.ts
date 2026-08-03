import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';

export const exportUserData = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const dataBundle = await userService.exportUserDataBundle(userId);
    return res.json({ data: dataBundle });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    await userService.deleteUserAccount(userId);
    return res.status(200).json({
      message: 'Account and associated user data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};
