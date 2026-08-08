/**
 * @fileoverview Notes router module.
 * 
 * Express router serving CRUD operations for user learning notes.
 * All routes require authentication via `requireAuth`.
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { createNoteSchema, updateNoteSchema, idParamSchema } from '../validators/notes.schema.js';
import {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
} from '../controllers/notes.controller.js';

const router = Router();

// Apply authentication middleware to all note routes
router.use(requireAuth);

/**
 * GET /
 * Retrieves all notes for the authenticated user.
 */
router.get('/', getNotes);

/**
 * POST /
 * Creates a new note.
 * Validates request body against `createNoteSchema`.
 */
router.post('/', validateBody(createNoteSchema), createNote);

/**
 * GET /:id
 * Retrieves a specific note by its UUID.
 * Validates route parameter against `idParamSchema`.
 */
router.get('/:id', validateParams(idParamSchema), getNoteById);

/**
 * PUT /:id
 * Updates an existing note by its UUID.
 * Validates route parameter against `idParamSchema` and request body against `updateNoteSchema`.
 */
router.put('/:id', validateParams(idParamSchema), validateBody(updateNoteSchema), updateNote);

/**
 * DELETE /:id
 * Deletes a note by its UUID.
 * Validates route parameter against `idParamSchema`.
 */
router.delete('/:id', validateParams(idParamSchema), deleteNote);

export default router;

