/**
 * @file activities.controller.ts
 * @description HTTP route handlers for managing user learning activity entries (ActivityEntry).
 */

import { Request, Response, NextFunction } from 'express';
import type { ActivityType } from '@himma/contracts';
import * as activitiesService from './activities.service.js';

/**
 * Handles GET `/api/activities` request to fetch a paginated list of user activity entries.
 * Supports filtering by activity `type`, `tag`, limit/offset pagination, and optional total count.
 *
 * @param req - Express Request object containing authenticated `req.user` and query parameters.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const type = req.query.type as ActivityType | undefined;
  const tag = req.query.tag as string | undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
  const offset = parseInt((req.query.offset as string) || '0', 10);
  const includeTotal = req.query.includeTotal === 'true';

  try {
    const { activities, hasMore, total } = await activitiesService.listActivities(
      userId,
      type,
      tag,
      limit,
      offset,
      includeTotal
    );

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.json({
      data: activities,
      pagination: {
        total: total ?? (offset + activities.length + (hasMore ? 1 : 0)),
        limit,
        offset,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST `/api/activities` request to create a new activity entry for the authenticated user.
 *
 * @param req - Express Request object containing authenticated `req.user` and validated body payload.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const createActivity = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const activity = await activitiesService.createActivityForUser(userId, req.body);
    return res.status(201).json({ data: activity });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET `/api/activities/:id` request to retrieve a single activity entry owned by the user.
 *
 * @param req - Express Request object containing authenticated `req.user` and route params (`id`).
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
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

/**
 * Handles PATCH `/api/activities/:id` request to update an existing activity entry owned by the user.
 *
 * @param req - Express Request object containing authenticated `req.user`, route params (`id`), and update body payload.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
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

/**
 * Handles DELETE `/api/activities/:id` request to delete an activity entry owned by the user.
 *
 * @param req - Express Request object containing authenticated `req.user` and route params (`id`).
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
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
