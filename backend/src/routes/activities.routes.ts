import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { createActivitySchema, updateActivitySchema } from '../validators/activities.schema.js';
import { idParamSchema } from '../validators/notes.schema.js';
import {
  getActivities,
  createActivity,
  getActivityById,
  updateActivity,
  deleteActivity,
} from '../controllers/activities.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getActivities);
router.post('/', validateBody(createActivitySchema), createActivity);
router.get('/:id', validateParams(idParamSchema), getActivityById);
router.put('/:id', validateParams(idParamSchema), validateBody(updateActivitySchema), updateActivity);
router.delete('/:id', validateParams(idParamSchema), deleteActivity);

export default router;
