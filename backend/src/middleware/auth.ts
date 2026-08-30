/**
 * @file auth.ts
 * @description Authentication middleware and provider abstractions supporting local JWT token verification.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Decoupled User Interface representing authenticated identity.
 */
export interface AuthUser {
  /** Unique user ID */
  id: string;
  /** User email address */
  email?: string;
  /** Authenticated role (defaults to 'authenticated') */
  role?: string;
  /** Additional custom metadata */
  metadata?: Record<string, any>;
}

// Extend Express Request type to include standard user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Auth Provider interface abstraction for verifying tokens and retrieving user metadata.
 */
export interface AuthProvider {
  /**
   * Verifies an incoming authorization token and returns the corresponding AuthUser object.
   *
   * @param token - Bearer token string to verify.
   * @returns AuthUser if token is valid, or null if invalid or expired.
   */
  verifyToken(token: string): Promise<AuthUser | null>;
}

/**
 * Local JWT Auth Provider implementation using jsonwebtoken.
 * Verifies JWT access tokens signed with the server's JWT_SECRET.
 */
export class LocalJwtAuthProvider implements AuthProvider {
  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email?: string;
        role?: string;
        [key: string]: any;
      };

      if (!decoded || !decoded.id) {
        return null;
      }

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'authenticated',
        metadata: decoded,
      };
    } catch (err) {
      return null;
    }
  }
}

let currentAuthProvider: AuthProvider = new LocalJwtAuthProvider();

/**
 * Configures the active Auth Provider strategy.
 *
 * @param provider - Instance implementing AuthProvider interface.
 */
export const setAuthProvider = (provider: AuthProvider) => {
  currentAuthProvider = provider;
};

/**
 * Authentication middleware (`requireAuth`).
 * Extracts Bearer token from the `Authorization` header, delegates verification to the active AuthProvider,
 * and attaches standard `req.user` payload.
 *
 * @param req - Express Request object.
 * @param res - Express Response object.
 * @param next - Express NextFunction callback.
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Expected format: "Bearer <token>".',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = await currentAuthProvider.verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid, expired, or revoked authentication token.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed.',
    });
  }
};

/**
 * Alias of `authenticateUser` for Express middleware naming consistency.
 */
export const requireAuth = authenticateUser;
