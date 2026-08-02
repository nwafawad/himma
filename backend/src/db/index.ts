import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { env } from '../config/env.js';

// Global singleton instance of PrismaClient to prevent connection exhaustion in dev mode
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Supabase PostgreSQL connection pool setup
const isLocalhost = env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1');

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute a raw SQL query using the pool.
 */
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
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
