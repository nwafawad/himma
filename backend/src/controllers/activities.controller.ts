import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/index.js';
import { ActivitySource, ActivityType } from '@prisma/client';

// Zod schemas for activity entry validation
export const createActivitySchema = z.object({
  source: z.nativeEnum(ActivitySource),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Invalid URL format').optional().nullable(),
  type: z.nativeEnum(ActivityType),
  tags: z.array(z.string()).optional().default([]),
  consumedAt: z.string().datetime().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

/**
 * GET /api/v1/activities
 * List all activity entries for the authenticated user with optional tag filtering & pagination.
 */
export const getActivities = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const tag = req.query.tag as string | undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  try {
    const where: any = { userId };
    if (tag) {
      where.tags = { has: tag };
    }

    const [activities, total] = await Promise.all([
      prisma.activityEntry.findMany({
        where,
        orderBy: { consumedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activityEntry.count({ where }),
    ]);

    return res.json({
      data: activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + activities.length < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * POST /api/v1/activities
 * Create a new activity entry for the authenticated user.
 */
export const createActivity = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const parseResult = createActivitySchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Bad Request',
      details: parseResult.error.format(),
    });
  }

  const { source, title, url, type, tags, consumedAt } = parseResult.data;

  try {
    const activity = await prisma.activityEntry.create({
      data: {
        userId,
        source,
        title,
        url,
        type,
        tags: tags || [],
        consumedAt: consumedAt ? new Date(consumedAt) : new Date(),
      },
    });

    return res.status(201).json({ data: activity });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * GET /api/v1/activities/:id
 * Get a single activity entry by ID.
 */
export const getActivityById = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const activity = await prisma.activityEntry.findFirst({
      where: { id, userId },
      include: { notesLinked: true },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Not Found', message: 'Activity entry not found' });
    }

    return res.json({ data: activity });
  } catch (error: any) {
    console.error('Error fetching activity by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * PUT /api/v1/activities/:id
 * Update an existing activity entry for the authenticated user.
 */
export const updateActivity = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const parseResult = updateActivitySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Bad Request',
      details: parseResult.error.format(),
    });
  }

  try {
    const existing = await prisma.activityEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Activity entry not found' });
    }

    const { source, title, url, type, tags, consumedAt } = parseResult.data;

    const updated = await prisma.activityEntry.update({
      where: { id },
      data: {
        ...(source && { source }),
        ...(title && { title }),
        ...(url !== undefined && { url }),
        ...(type && { type }),
        ...(tags && { tags }),
        ...(consumedAt && { consumedAt: new Date(consumedAt) }),
      },
    });

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating activity:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * DELETE /api/v1/activities/:id
 * Delete an activity entry.
 */
export const deleteActivity = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const existing = await prisma.activityEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Activity entry not found' });
    }

    await prisma.activityEntry.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Activity entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
