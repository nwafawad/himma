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

router.use(requireAuth);

router.get('/', getNotes);
router.post('/', validateBody(createNoteSchema), createNote);
router.get('/:id', validateParams(idParamSchema), getNoteById);
router.put('/:id', validateParams(idParamSchema), validateBody(updateNoteSchema), updateNote);
router.delete('/:id', validateParams(idParamSchema), deleteNote);

export default router;
