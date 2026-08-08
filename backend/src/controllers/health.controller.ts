/**
 * @file health.controller.ts
 * @description HTTP route handler for system health checks and database connectivity metrics.
 */

import { Request, Response } from 'express';
import { checkDbHealth } from '../db/index.js';
import { env } from '../config/env.js';

/**
 * Handles GET `/api/health` request evaluating overall application status, uptime, environment, and PostgreSQL latency.
 * Returns HTTP 200 if database is reachable, or HTTP 503 if disconnected.
 *
 * @param _req - Express Request object.
 * @param res - Express Response object.
 */
export const getHealth = async (_req: Request, res: Response) => {
  const dbHealth = await checkDbHealth();

  const isHealthy = dbHealth.isConnected;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    environment: env.NODE_ENV,
    database: {
      status: dbHealth.isConnected ? 'connected' : 'disconnected',
      ...(dbHealth.latencyMs !== undefined ? { latencyMs: dbHealth.latencyMs } : {}),
      ...(dbHealth.error ? { error: dbHealth.error } : {}),
    },
  });
};

