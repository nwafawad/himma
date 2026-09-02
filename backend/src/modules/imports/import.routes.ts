/**
 * @fileoverview Browser history import router module.
 * 
 * Manages HTTP routes for importing external browser history into the platform, including:
 * - Direct export file uploads (JSON / text) handled via Multer memory storage.
 * - Manual pasting of URL lists.
 * - Staged candidate retrieval and batch import confirmation.
 * 
 * Enforces rate limiting on import ingestion endpoints to prevent resource abuse.
 */

import { Router } from 'express';
import multer from 'multer';
import { importUrlsInputSchema, confirmImportInputSchema } from '@himma/contracts';
import { requireAuth } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/security.js';
import { validateBody } from '../../middleware/validate.js';
import * as importController from './import.controller.js';

/**
 * Multer middleware instance configured for history file uploads.
 * 
 * - Memory Storage: Files are held in memory buffer for inline parsing.
 * - Limits: 20MB maximum file size.
 * - File Filter: Validates MIME type and extensions to enforce `.json` or text file imports.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
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

/**
 * Rate limiter middleware for bulk history imports.
 * Restricts requests to 15 per 15-minute window per IP/user.
 */
const importLimiter = createRateLimiter({
  scope: 'imports.ingest',
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many import requests. Please wait before staging more history items.',
});

// Apply authentication middleware to all import routes
router.use(requireAuth);

/**
 * POST /upload
 * Uploads a browser history JSON/text export file for parsing and staging candidates.
 * Uses rate limiting and Multer single-file handler ('file').
 */
router.post('/upload', importLimiter, upload.single('file'), importController.uploadHistoryFile);

/**
 * POST /urls
 * Imports a batch of manually submitted URLs into the staging candidate pool.
 * Rate limited and validated against `importUrlsSchema`.
 */
router.post('/urls', importLimiter, validateBody(importUrlsInputSchema), importController.importPastedUrls);

/**
 * GET /candidates
 * Fetches pending history candidates currently staged for user review and confirmation.
 */
router.get('/candidates', importController.getPendingCandidates);

/**
 * POST /confirm
 * Confirms selected or all staged history candidates to convert them into active activity records.
 * Validated against `confirmImportSchema`.
 */
router.post('/confirm', validateBody(confirmImportInputSchema), importController.confirmCandidates);

export default router;
