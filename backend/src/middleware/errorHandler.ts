/**
 * @file errorHandler.ts
 * @description Centralized Express global error handling middleware catching database, validation, upload, and unknown runtime errors.
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library.js';
import multer from 'multer';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

/**
 * Global Express error handling middleware function.
 * Maps specific error types (JSON syntax, Multer, Zod validation, Prisma ORM errors) to structured JSON HTTP responses.
 *
 * @param err - Caught error object or exception.
 * @param req - Express Request object.
 * @param res - Express Response object.
 * @param next - Express NextFunction callback.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Unhandled Error:', err);

  // Express Malformed JSON Body Parsing Error
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Malformed JSON payload provided in request body.',
    });
  }

  // Multer File Upload Errors
  if (err instanceof multer.MulterError || err.name === 'MulterError') {
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(statusCode).json({
      error: statusCode === 413 ? 'Payload Too Large' : 'Bad Request',
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file exceeds the maximum allowed size limit (5MB).'
        : `File upload error: ${err.message}`,
      code: err.code,
    });
  }

  // Custom Upload Filter Validation Errors
  if (err?.code === 'UNSAFE_URL') {
    return res.status(400).json({ error: 'Bad Request', code: 'UNSAFE_URL', message: err.message });
  }
  if (err?.code === 'ACCOUNT_DELETION_FAILED' || err?.code === 'ACCOUNT_DELETION_INCOMPLETE') {
    return res.status(err.statusCode || 500).json({ error: 'Account Deletion Failed', code: err.code, message: err.message });
  }

  if (err.message && typeof err.message === 'string' && err.message.startsWith('INVALID_')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: err.message,
    });
  }

  // Zod Validation Errors
  if (err instanceof ZodError || err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input payload.',
      details: (err as ZodError).format(),
    });
  }

  // Prisma Known Request Errors (e.g. unique constraint violation, record not found)
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          error: 'Conflict',
          message: `Unique constraint failed on field(s): ${(err.meta?.target as string[])?.join(', ') || 'unknown'}`,
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Not Found',
          message: 'The requested record was not found.',
        });
      case 'P2003':
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Foreign key constraint failed on referenced record.',
        });
      default:
        return res.status(400).json({
          error: 'Database Error',
          code: err.code,
          message: err.message,
        });
    }
  }

  // Prisma Database Connection / Initialization Errors
  if (err instanceof PrismaClientInitializationError) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database server is unreachable or initializing.',
    });
  }

  // Prisma Validation Errors
  if (err instanceof PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid data format provided for database operation.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.name || 'Error',
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
