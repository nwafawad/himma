/**
 * @file notes.controller.ts
 * @description HTTP route handlers for managing user learning note entries (NoteEntry).
 */

import { Request, Response, NextFunction } from 'express';
import * as notesService from './notes.service.js';

/**
 * Handles GET `/api/notes` request to fetch a paginated list of user note entries.
 * Supports filtering by `tag`, `linkedActivityId`, and limit/offset pagination parameters.
 *
 * @param req - Express Request object containing authenticated `req.user` and query parameters.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const getNotes = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const tag = req.query.tag as string | undefined;
  const linkedActivityId = req.query.linkedActivityId as string | undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  try {
    const { notes, total } = await notesService.listNotes(userId, tag, linkedActivityId, limit, offset);
    return res.json({
      data: notes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + notes.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST `/api/notes` request to create a new note entry for the authenticated user.
 *
 * @param req - Express Request object containing authenticated `req.user` and validated body payload.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const note = await notesService.createNoteForUser(userId, req.body);
    return res.status(201).json({ data: note });
  } catch (error) {
    if (error instanceof Error && error.message === 'REFERENCED_ACTIVITY_NOT_FOUND') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Referenced linkedActivityId does not exist or does not belong to the user.',
      });
    }
    next(error);
  }
};

/**
 * Handles GET `/api/notes/:id` request to retrieve a single note entry owned by the user.
 *
 * @param req - Express Request object containing authenticated `req.user` and route params (`id`).
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const getNoteById = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const note = await notesService.getNoteByIdAndUser(id, userId);
    if (!note) {
      return res.status(404).json({ error: 'Not Found', message: 'Note entry not found.' });
    }
    return res.json({ data: note });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH `/api/notes/:id` request to update an existing note entry owned by the user.
 *
 * @param req - Express Request object containing authenticated `req.user`, route params (`id`), and update payload.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const note = await notesService.updateNoteForUser(id, userId, req.body);
    if (!note) {
      return res.status(404).json({ error: 'Not Found', message: 'Note entry not found.' });
    }
    return res.json({ data: note });
  } catch (error) {
    if (error instanceof Error && error.message === 'REFERENCED_ACTIVITY_NOT_FOUND') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Referenced linkedActivityId does not exist or does not belong to the user.',
      });
    }
    next(error);
  }
};

/**
 * Handles DELETE `/api/notes/:id` request to delete a note entry owned by the user.
 *
 * @param req - Express Request object containing authenticated `req.user` and route params (`id`).
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const deleted = await notesService.deleteNoteForUser(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Note entry not found.' });
    }
    return res.status(200).json({ message: 'Note entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
