import express from 'express';
import { applySecurityMiddleware } from './middleware/security.js';
import { enforceHttps } from './middleware/enforceHttps.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

// Trust edge proxy (Render / Railway / reverse proxy) for accurate IP and protocol (x-forwarded-proto) detection
app.set('trust proxy', 1);

// HTTPS Enforcement in production
app.use(enforceHttps);

// Apply Security headers, CORS, and body size limits
applySecurityMiddleware(app);

// Top-level /health route for cloud provider container health checks
app.use('/health', healthRoutes);

// Dual REST API routing (/api and /api/v1)
app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// 404 Handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
