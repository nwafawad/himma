import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import compression from 'compression';
import { applySecurityMiddleware } from './middleware/security.js';
import { enforceHttps } from './middleware/enforceHttps.js';
import { errorHandler } from './middleware/errorHandler.js';
import { markDeprecatedRoute } from './middleware/deprecation.js';
import { uploadRootDirectory } from './infrastructure/storage/index.js';
import apiRouter from './routes/index.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

// Trust edge proxy (Render / Railway / reverse proxy) for accurate IP and protocol (x-forwarded-proto) detection
app.set('trust proxy', 1);

// HTTPS Enforcement in production
app.use(enforceHttps);

// Enable response compression (gzip/brotli)
app.use(compression());

// Apply Security headers, CORS, and body size limits
applySecurityMiddleware(app);

// Serve locally uploaded files (e.g. avatars) statically
app.use('/uploads', express.static(uploadRootDirectory));

// Top-level /health route for cloud provider container health checks
app.use('/health', healthRoutes);

// Canonical versioned API and backwards-compatible legacy prefix.
app.use('/api/v1', apiRouter);
app.use('/api', markDeprecatedRoute((requestPath) => `/api/v1${requestPath}`), apiRouter);

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
