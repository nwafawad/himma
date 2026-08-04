import { prisma } from '../config/prisma.js';

export { prisma };

/**
 * Execute a raw SQL query using Prisma engine.
 */
export const query = (text: string, params: any[] = []) => {
  return prisma.$queryRawUnsafe(text, ...params);
};

/**
 * Check connectivity to the PostgreSQL database for health checks via Prisma.
 */
export const checkDbHealth = async (): Promise<{ isConnected: boolean; latencyMs?: number; error?: string }> => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { isConnected: true, latencyMs };
  } catch (err: any) {
    return { isConnected: false, error: err.message || 'Database connection error' };
  }
};

/**
 * Close database client connections gracefully.
 */
export const closeDbConnections = async (): Promise<void> => {
  await prisma.$disconnect();
};
