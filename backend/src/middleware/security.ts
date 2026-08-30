/**
 * @file security.ts
 * @description Security middleware suite: Helmet header protection, CORS origin whitelisting, payload size limits, and in-memory rate limiting.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

/**
 * Interface representing a client's sliding window rate limit entry.
 */
/**
 * Lightweight, zero-dependency in-memory sliding window rate limiter factory.
 *
 * @param options - Configuration options specifying `windowMs` duration, `max` requests limit, and optional error message.
 * @returns Express middleware function enforcing rate limiting rules.
 */
export const createRateLimiter = (options: { scope: string; windowMs: number; max: number; message?: string }) => {
  const { scope, windowMs, max, message = 'Too many requests, please try again later.' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
    const expiresAt = new Date(windowStart.getTime() + windowMs);
    try {
      const rows = await prisma.$queryRaw<Array<{ count: number }>>`
        INSERT INTO private.api_rate_limits (scope, key, window_start, count, expires_at)
        VALUES (${scope}, ${key}, ${windowStart}, 1, ${expiresAt})
        ON CONFLICT (scope, key, window_start)
        DO UPDATE SET count = private.api_rate_limits.count + 1
        RETURNING count
      `;
      if (Math.random() < 0.01) {
        void prisma.$executeRaw`DELETE FROM private.api_rate_limits WHERE expires_at < now()`;
      }
      if ((rows[0]?.count ?? 1) > max) {
        const retryAfterSeconds = Math.ceil((expiresAt.getTime() - now) / 1000);
        res.setHeader('Retry-After', retryAfterSeconds);
        return res.status(429).json({ error: 'Too Many Requests', message });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

/**
 * Configures global security middleware on the Express application:
 * - Helmet for HTTP security headers
 * - Dynamic CORS with origin whitelisting (`CLIENT_URL` and `CORS_ORIGIN`)
 * - Body parsing size limits (1MB default limit to prevent payload overload attacks)
 *
 * @param app - Express application instance.
 */
export const applySecurityMiddleware = (app: Express): void => {
  // HTTP Header Security
  app.use(helmet());

  // Dynamic CORS origin configuration
  const rawOrigins = [env.CLIENT_URL, env.CORS_ORIGIN]
    .filter(Boolean)
    .flatMap((val) => (val === '*' ? '*' : val!.split(',').map((o) => o.trim())));

  const allowedOrigins = rawOrigins.includes('*') ? '*' : Array.from(new Set(rawOrigins));

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin || allowedOrigins === '*') {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(new Error('CORS policy error: Origin not allowed by CORS whitelist'));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    })
  );

  // Payload body size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
};
