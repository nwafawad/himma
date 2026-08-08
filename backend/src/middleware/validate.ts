/**
 * @file validate.ts
 * @description Higher-order Express middleware for validating request body, query parameters, and route params against Zod schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Higher-order middleware to validate `req.body` against a Zod schema.
 * If validation succeeds, replaces `req.body` with parsed/coerced data and calls `next()`.
 *
 * @param schema - Zod schema to validate `req.body` against.
 * @returns Express middleware function.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid request body payload.',
        details: (parseResult.error as ZodError).format(),
      });
    }
    req.body = parseResult.data;
    next();
  };
};

/**
 * Higher-order middleware to validate `req.query` against a Zod schema.
 * If validation succeeds, replaces `req.query` with parsed/coerced data and calls `next()`.
 *
 * @param schema - Zod schema to validate `req.query` against.
 * @returns Express middleware function.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid query parameters.',
        details: (parseResult.error as ZodError).format(),
      });
    }
    req.query = parseResult.data as any;
    next();
  };
};

/**
 * Higher-order middleware to validate `req.params` against a Zod schema.
 * If validation succeeds, replaces `req.params` with parsed/coerced data and calls `next()`.
 *
 * @param schema - Zod schema to validate `req.params` against.
 * @returns Express middleware function.
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const parseResult = schema.safeParse(req.params);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid route parameters.',
        details: (parseResult.error as ZodError).format(),
      });
    }
    req.params = parseResult.data as any;
    next();
  };
};

