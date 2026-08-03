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
