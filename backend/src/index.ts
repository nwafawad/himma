import app from './app.js';
import { env } from './config/env.js';
import { pool } from './db/index.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Momentum Backend Service running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`🏥 Health Check available at http://localhost:${env.PORT}/health`);
});

// Graceful shutdown handling for container management (Render / Railway / Docker)
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️ Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('🔒 Closed active HTTP server connections.');
    try {
      await pool.end();
      console.log('🐘 PostgreSQL pool has been closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database pool shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds timeout
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
