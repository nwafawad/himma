import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.js';
import {
  getActivities,
  createActivity,
  getActivityById,
  updateActivity,
  deleteActivity,
} from '../controllers/activities.controller.js';

const router = Router();

// Protect all activity routes with Auth Middleware
router.use(authenticateUser);

router.get('/', getActivities);
router.post('/', createActivity);
router.get('/:id', getActivityById);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);

export default router;
