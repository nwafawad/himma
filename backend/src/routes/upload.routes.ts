/**
 * @fileoverview File upload router module.
 * 
 * Express router handling multipart file uploads (e.g. avatar images) using Multer.
 * Uploaded files are stored locally in the server's uploads/ directory.
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'anonymous';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  },
});

// Configure file filter (accept only images)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.'));
  }
};

const upload = multer({
  storage,
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
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No image file provided under field "avatar".',
        });
      }

      // Generate relative URL path for client consumption
      const relativeUrl = `/uploads/avatars/${req.file.filename}`;

      return res.status(200).json({
        data: {
          url: relativeUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
        message: 'Avatar uploaded successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
