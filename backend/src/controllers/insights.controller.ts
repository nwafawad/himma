import { Request, Response, NextFunction } from 'express';
import * as insightsService from '../services/insights.service.js';

export const getInsightRuns = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  try {
    const { insights, total } = await insightsService.listInsightRuns(userId, limit, offset);
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

export const createInsightRun = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const insight = await insightsService.createInsightRunForUser(userId, req.body);
    return res.status(201).json({ data: insight });
  } catch (error) {
    next(error);
  }
};

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
 * POST /api/insights/generate
 * Trigger AI Insight Engine Pipeline for the authenticated user.
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
 * POST /api/insights/:id/feedback
 * Record user feedback ('confirm' or 'correct') on an insight run.
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
