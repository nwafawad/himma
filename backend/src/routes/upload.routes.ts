/**
 * @fileoverview File upload router module.
 * 
 * Express router handling multipart file uploads (e.g. avatar images) using Multer.
 * Uploaded files are persisted through the configured storage adapter.
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { uploadStorage } from '../infrastructure/storage/index.js';
import { supportedAvatarMimeTypes } from '../infrastructure/storage/storage.js';

const router = Router();

// Configure file filter (accept only images)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (supportedAvatarMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, or GIF) are allowed.'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

/**
 * POST /avatar
 * Uploads a user profile avatar image and returns the accessible static URL path.
 */
router.post(
  '/avatar',
  requireAuth,
  upload.single('avatar'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No image file provided under field "avatar".',
        });
      }

      const storedUpload = await uploadStorage.storeAvatar({
        userId: req.user!.id,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      return res.status(200).json({
        data: storedUpload,
        message: 'Avatar uploaded successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
