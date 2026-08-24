import { postgresPool } from '../config/postgres.js';

export const withAdvisoryLock = async <T>(key: string, operation: () => Promise<T>): Promise<T> => {
  const client = await postgresPool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [key]);
    return await operation();
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [key]);
    } finally {
      client.release();
    }
  }
};

export const withTryAdvisoryLock = async <T>(key: string, operation: () => Promise<T>): Promise<T | null> => {
  const client = await postgresPool.connect();
  try {
    const result = await client.query<{ acquired: boolean }>(
      'SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS acquired',
      [key]
    );
    if (!result.rows[0]?.acquired) return null;
    try {
      return await operation();
    } finally {
      await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [key]);
    }
  } finally {
    client.release();
  }
};
