/**
 * @file insights.controller.ts
 * @description HTTP route handlers for AI insight generation, insight runs history retrieval, manual run creation, and user feedback submission.
 */

import { Request, Response, NextFunction } from 'express';
import * as insightsService from './insights.service.js';

/**
 * Handles GET `/api/insights` request to list historical AI insight runs generated for the authenticated user.
 *
 * @param req - Express Request object containing authenticated `req.user` and pagination query parameters (`limit`, `offset`).
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const getInsightRuns = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  try {
    const { insights, total } = await insightsService.listInsightRuns(userId, limit, offset);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.json({
      data: insights,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + insights.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST `/api/insights` request to manually create an insight run entry.
 *
 * @param req - Express Request object containing authenticated `req.user` and insight payload in body.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const createInsightRun = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const insight = await insightsService.createInsightRunForUser(userId, req.body);
    return res.status(201).json({ data: insight });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET `/api/insights/:id` request to retrieve a single insight run report owned by the user.
 *
 * @param req - Express Request object containing authenticated `req.user` and route params (`id`).
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const getInsightRunById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const insight = await insightsService.getInsightRunByIdAndUser(id, userId);
    if (!insight) {
      return res.status(404).json({ error: 'Not Found', message: 'Insight run report not found.' });
    }
    return res.json({ data: insight });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST `/api/insights/generate` request to trigger the AI Insight Engine Pipeline for the authenticated user.
 * Evaluates context activity logs, generates an insight report (or skips if insufficient data), and returns execution telemetry.
 *
 * @param req - Express Request object containing authenticated `req.user` and optional `timeframeDays` in request body.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const generateInsight = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const timeframeDays = parseInt((req.body.timeframeDays as string) || '30', 10);

  try {
    const result = await insightsService.generateAndSaveInsightRun(userId, timeframeDays);

    if (result.skipped) {
      return res.status(200).json({
        skipped: true,
        message: 'Insight generation skipped due to insufficient user logs in target timeframe.',
        reason: result.reason,
      });
    }

    return res.status(201).json({
      data: result.data,
      telemetry: result.telemetry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST `/api/insights/:id/feedback` request to record user feedback ('confirm' or 'correct') on an insight run.
 * Automatically updates user skills profile when feedback action is 'correct'.
 *
 * @param req - Express Request object containing authenticated `req.user`, route params (`id`), and feedback payload.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const postFeedback = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const result = await insightsService.processInsightFeedback(userId, id, req.body);

    if (!result) {
      return res.status(404).json({ error: 'Not Found', message: 'Insight run report not found.' });
    }

    return res.status(200).json({
      message: 'Feedback recorded successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
