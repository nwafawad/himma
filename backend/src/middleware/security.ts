import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';

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
