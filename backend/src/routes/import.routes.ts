import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/security.js';
import { validateBody } from '../middleware/validate.js';
import * as importController from '../controllers/import.controller.js';
import { importUrlsSchema, confirmImportSchema } from '../validators/import.schema.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB size limit per NFR-2.4
  },
  fileFilter: (_req, file, cb) => {
    // Validate file type
    if (
      file.mimetype === 'application/json' ||
      file.mimetype === 'text/plain' ||
      file.originalname.endsWith('.json')
    ) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only JSON export files are accepted for history import.'));
    }
  },
});

const router = Router();

// Rate limiter for bulk history imports (15 requests per 15 mins per user)
const importLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many import requests. Please wait before staging more history items.',
});

router.use(requireAuth);

router.post('/upload', importLimiter, upload.single('file'), importController.uploadHistoryFile);
router.post('/urls', importLimiter, validateBody(importUrlsSchema), importController.importPastedUrls);
router.get('/candidates', importController.getPendingCandidates);
router.post('/confirm', validateBody(confirmImportSchema), importController.confirmCandidates);

export default router;
