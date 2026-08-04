import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Lightweight, zero-dependency in-memory sliding window rate limiter.
 */
export const createRateLimiter = (options: { windowMs: number; max: number; message?: string }) => {
  const store: Map<string, RateLimitEntry> = new Map();
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  // Cleanup expired entries periodically
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime <= now) {
        store.delete(key);
      }
    }
  }, Math.max(windowMs, 60000));
  if (cleanupTimer.unref) cleanupTimer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetTime <= now) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
      });
    }

    next();
  };
};

/**
 * Configure standard security middleware:
 * - Helmet for HTTP security headers
 * - Dynamic CORS with origin whitelisting (CLIENT_URL and CORS_ORIGIN)
 * - Body parsing size limits (1MB default limit to prevent payload overload attacks)
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
