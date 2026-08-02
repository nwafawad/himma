import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';

/**
 * Configure standard security middleware:
 * - Helmet for HTTP security headers
 * - CORS with origin whitelisting
 * - Body parsing size limits (1MB default limit to prevent payload overload attacks)
 */
export const applySecurityMiddleware = (app: Express): void => {
  // HTTP Header Security
  app.use(helmet());

  // CORS configuration
  const allowedOrigins = env.CORS_ORIGIN === '*'
    ? '*'
    : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    })
  );

  // Payload body size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
};
