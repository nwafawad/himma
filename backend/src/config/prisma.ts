/**
 * @fileoverview Prisma ORM database client module.
 * 
 * Configures and exports a singleton `PrismaClient` instance. Uses global state persistence
 * in non-production environments to avoid exhausting database connection pools during hot-reloading.
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Global type declaration storing the PrismaClient instance across hot-reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Singleton Prisma client instance.
 * Enables verbose logging (`query`, `error`, `warn`) in development, and error-only logging in production.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Preserve client instance globally in development to prevent connection duplication
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

