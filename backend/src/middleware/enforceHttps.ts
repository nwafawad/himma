import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Middleware to enforce HTTPS in production environments.
 * 
 * Hosting Note:
 * On cloud platforms like Render and Railway, TLS termination occurs at the hosting
 * provider's edge proxy. The edge proxy forwards requests to the application container over HTTP
 * and sets the standard 'x-forwarded-proto' header to 'https' for secure client connections.
 * 
 * To ensure 'req.secure' and 'req.protocol' function accurately behind these proxies,
 * the Express app must configure `app.set('trust proxy', 1)`.
 */
export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV === 'production') {
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (!isSecure) {
      // Redirect plain HTTP traffic to HTTPS with 301 Permanent Redirect
      const host = req.headers.host;
      if (host) {
        return res.redirect(301, `https://${host}${req.originalUrl}`);
      }
      return res.status(403).json({
        error: 'Forbidden',
        message: 'HTTPS is required to access this service in production.',
      });
    }
  }

  next();
};
