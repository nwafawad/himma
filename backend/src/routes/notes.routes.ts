import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
} from '../controllers/notes.controller.js';

const router = Router();

// Protect all note routes with Auth Middleware
router.use(authenticateUser);

router.get('/', getNotes);
router.post('/', createNote);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
