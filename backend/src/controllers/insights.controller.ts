import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/index.js';
import { AlignmentScore } from '@prisma/client';

export const createInsightRunSchema = z.object({
  inputWindow: z.record(z.any()).optional().default({}),
  skillSummary: z.record(z.any()),
  directionSummary: z.record(z.any()),
  alignmentScore: z.nativeEnum(AlignmentScore),
  citations: z.union([z.array(z.string()), z.record(z.any())]).optional().default([]),
});

/**
 * GET /api/v1/insights
 * List all historical AI insight runs for the authenticated user.
 */
export const getInsightRuns = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  try {
    const [insights, total] = await Promise.all([
      prisma.insightRun.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.insightRun.count({ where: { userId } }),
    ]);

    return res.json({
      data: insights,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + insights.length < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching insight runs:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * POST /api/v1/insights
 * Log a new AI insight run (immutable record creation).
 */
export const createInsightRun = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const parseResult = createInsightRunSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Bad Request',
      details: parseResult.error.format(),
    });
  }

  const { inputWindow, skillSummary, directionSummary, alignmentScore, citations } = parseResult.data;

  try {
    const insight = await prisma.insightRun.create({
      data: {
        userId,
        inputWindow: inputWindow || {},
        skillSummary,
        directionSummary,
        alignmentScore,
        citations: citations || [],
      },
    });

    return res.status(201).json({ data: insight });
  } catch (error: any) {
    console.error('Error creating insight run:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * GET /api/v1/insights/:id
 * Fetch a single insight run by ID.
 */
export const getInsightRunById = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const insight = await prisma.insightRun.findFirst({
      where: { id, userId },
    });

    if (!insight) {
      return res.status(404).json({ error: 'Not Found', message: 'Insight run report not found' });
    }

    return res.json({ data: insight });
  } catch (error: any) {
    console.error('Error fetching insight run by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
