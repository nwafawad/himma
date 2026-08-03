import { Request, Response, NextFunction } from 'express';
import * as activitiesService from '../services/activities.service.js';
import { ActivityType } from '@prisma/client';

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const type = req.query.type as ActivityType | undefined;
  const tag = req.query.tag as string | undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  try {
    const { activities, total } = await activitiesService.listActivities(userId, type, tag, limit, offset);
    return res.json({
      data: activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + activities.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const activity = await activitiesService.createActivityForUser(userId, req.body);
    return res.status(201).json({ data: activity });
  } catch (error) {
    next(error);
  }
};

export const getActivityById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const activity = await activitiesService.getActivityByIdAndUser(id, userId);
    if (!activity) {
      return res.status(404).json({ error: 'Not Found', message: 'Activity entry not found.' });
    }
    return res.json({ data: activity });
  } catch (error) {
    next(error);
  }
};

export const updateActivity = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const updated = await activitiesService.updateActivityForUser(id, userId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Not Found', message: 'Activity entry not found.' });
    }
    return res.json({ data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteActivity = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const deleted = await activitiesService.deleteActivityForUser(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Activity entry not found.' });
    }
    return res.status(200).json({ message: 'Activity entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
