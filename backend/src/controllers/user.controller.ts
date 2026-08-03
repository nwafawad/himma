import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';

export const exportUserData = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const dataBundle = await userService.exportUserDataBundle(userId);

    const filename = `momentum_export_${userId}_${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(JSON.stringify(dataBundle, null, 2));
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    await userService.deleteUserAccount(userId);
    return res.status(200).json({
      message: 'Account and all associated user records (profile, activities, notes, candidates, insights) have been permanently deleted in accordance with Section 11.3 data privacy requirements.',
      deletedAt: new Date().toISOString(),
      retentionPolicyDays: 30,
      purgedImmediately: true,
    });
  } catch (error) {
    next(error);
  }
};
