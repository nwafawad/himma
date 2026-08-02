import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/index.js';

// Zod validation schemas for note entries
export const createNoteSchema = z.object({
  text: z.string().min(1, 'Note text is required'),
  tags: z.array(z.string()).optional().default([]),
  linkedActivityId: z.string().uuid('Invalid activity UUID').optional().nullable(),
});

export const updateNoteSchema = createNoteSchema.partial();

/**
 * GET /api/v1/notes
 * List all note entries for the authenticated user with optional tag and linkedActivityId filter.
 */
export const getNotes = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const tag = req.query.tag as string | undefined;
  const linkedActivityId = req.query.linkedActivityId as string | undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  try {
    const where: any = { userId };
    if (tag) {
      where.tags = { has: tag };
    }
    if (linkedActivityId) {
      where.linkedActivityId = linkedActivityId;
    }

    const [notes, total] = await Promise.all([
      prisma.noteEntry.findMany({
        where,
        include: { linkedActivity: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.noteEntry.count({ where }),
    ]);

    return res.json({
      data: notes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + notes.length < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * POST /api/v1/notes
 * Create a new note entry for the authenticated user.
 */
export const createNote = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const parseResult = createNoteSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Bad Request',
      details: parseResult.error.format(),
    });
  }

  const { text, tags, linkedActivityId } = parseResult.data;

  try {
    // If linkedActivityId is supplied, verify it belongs to user
    if (linkedActivityId) {
      const activity = await prisma.activityEntry.findFirst({
        where: { id: linkedActivityId, userId },
      });
      if (!activity) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Referenced linkedActivityId does not exist or does not belong to the user',
        });
      }
    }

    const note = await prisma.noteEntry.create({
      data: {
        userId,
        text,
        tags: tags || [],
        linkedActivityId: linkedActivityId || null,
      },
      include: { linkedActivity: true },
    });

    return res.status(201).json({ data: note });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * GET /api/v1/notes/:id
 * Fetch a single note entry by ID.
 */
export const getNoteById = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const note = await prisma.noteEntry.findFirst({
      where: { id, userId },
      include: { linkedActivity: true },
    });

    if (!note) {
      return res.status(404).json({ error: 'Not Found', message: 'Note entry not found' });
    }

    return res.json({ data: note });
  } catch (error: any) {
    console.error('Error fetching note by ID:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * PUT /api/v1/notes/:id
 * Update an existing note entry.
 */
export const updateNote = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const parseResult = updateNoteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Bad Request',
      details: parseResult.error.format(),
    });
  }

  try {
    const existing = await prisma.noteEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Note entry not found' });
    }

    const { text, tags, linkedActivityId } = parseResult.data;

    if (linkedActivityId) {
      const activity = await prisma.activityEntry.findFirst({
        where: { id: linkedActivityId, userId },
      });
      if (!activity) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Referenced linkedActivityId does not exist or does not belong to the user',
        });
      }
    }

    const updated = await prisma.noteEntry.update({
      where: { id },
      data: {
        ...(text && { text }),
        ...(tags && { tags }),
        ...(linkedActivityId !== undefined && { linkedActivityId }),
      },
      include: { linkedActivity: true },
    });

    return res.json({ data: updated });
  } catch (error: any) {
    console.error('Error updating note:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * DELETE /api/v1/notes/:id
 * Delete a note entry.
 */
export const deleteNote = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const existing = await prisma.noteEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Note entry not found' });
    }

    await prisma.noteEntry.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Note entry deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
