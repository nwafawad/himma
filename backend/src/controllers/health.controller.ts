import { Request, Response } from 'express';
import { checkDbHealth } from '../db/index.js';
import { env } from '../config/env.js';

/**
 * Health check controller evaluating service status and PostgreSQL connectivity.
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
