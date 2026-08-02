import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/index.js';

export const upsertProfileSchema = z.object({
  currentSkills: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  targetPath: z.string().optional().nullable(),
});

/**
 * GET /api/v1/profile
 * Get authenticated user's skills & goals profile.
 */
export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const profile = await prisma.skillsGoalsProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Skills & goals profile has not been created yet.',
      });
    }

    return res.json({ data: profile });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * PUT /api/v1/profile
 * Upsert authenticated user's skills & goals profile.
 */
export const upsertProfile = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const parseResult = upsertProfileSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Bad Request',
      details: parseResult.error.format(),
    });
  }

  const { currentSkills, interests, targetPath } = parseResult.data;

  try {
    const profile = await prisma.skillsGoalsProfile.upsert({
      where: { userId },
      create: {
        userId,
        currentSkills: currentSkills || [],
        interests: interests || [],
        targetPath: targetPath || null,
      },
      update: {
        currentSkills: currentSkills || [],
        interests: interests || [],
        targetPath: targetPath || null,
      },
    });

    return res.json({ data: profile });
  } catch (error: any) {
    console.error('Error upserting profile:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
