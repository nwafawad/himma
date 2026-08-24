import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;
export const postgresPool = new Pool({
  connectionString: env.DIRECT_URL || env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const closePostgresPool = () => postgresPool.end();
