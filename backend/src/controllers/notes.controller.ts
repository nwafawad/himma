import { Request, Response, NextFunction } from 'express';
import * as notesService from '../services/notes.service.js';

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

export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  try {
    const note = await notesService.createNoteForUser(userId, req.body);
    return res.status(201).json({ data: note });
  } catch (error: any) {
    if (error.message === 'REFERENCED_ACTIVITY_NOT_FOUND') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Referenced linkedActivityId does not exist or does not belong to the user.',
      });
    }
    next(error);
  }
};

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

export const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { id } = req.params;
  try {
    const note = await notesService.updateNoteForUser(id, userId, req.body);
    if (!note) {
      return res.status(404).json({ error: 'Not Found', message: 'Note entry not found.' });
    }
    return res.json({ data: note });
  } catch (error: any) {
    if (error.message === 'REFERENCED_ACTIVITY_NOT_FOUND') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Referenced linkedActivityId does not exist or does not belong to the user.',
      });
    }
    next(error);
  }
};

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
