import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { exportUserData, deleteAccount } from '../controllers/user.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/export', exportUserData);
router.delete('/account', deleteAccount);

export default router;
