/**
 * @file auth.ts
 * @description Authentication middleware and provider abstractions supporting Supabase Auth and token verification.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

/**
 * Decoupled User Interface representing authenticated identity across providers (Supabase Auth / Clerk).
 */
export interface AuthUser {
  /** Unique user ID from auth provider */
  id: string;
  /** User email address */
  email?: string;
  /** Authenticated role (defaults to 'authenticated') */
  role?: string;
  /** Additional custom metadata from auth provider */
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

// In-memory set to cache auto-provisioned user IDs per process lifetime
const provisionedUserIds = new Set<string>();

/**
 * Clears the in-memory user auto-provisioning cache.
 * Useful for unit and integration testing reset steps.
 */
export const clearProvisionedUserCache = () => {
  provisionedUserIds.clear();
};

/**
 * Supabase Auth Provider implementation using @supabase/supabase-js.
 * Verifies JWT access tokens with Supabase Auth (`supabase.auth.getUser`).
 */
export class SupabaseAuthProvider implements AuthProvider {
  /**
   * Verifies a Supabase JWT access token. Includes development mock token fallbacks when NODE_ENV !== 'production'.
   *
   * @param token - JWT access token string.
   * @returns Verified AuthUser or null if verification fails.
   */
  async verifyToken(token: string): Promise<AuthUser | null> {
    // Development mock token fallback allowed ONLY in non-production environments
    if (env.NODE_ENV !== 'production' && (token === 'mock-supabase-token' || token === 'valid-scaffold-token')) {
      return {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'dev.user@momentum.app',
        role: 'authenticated',
        metadata: { dev: true },
      };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role || 'authenticated',
        metadata: user.user_metadata,
      };
    } catch (err) {
      console.error('Error verifying Supabase JWT token:', err);
      return null;
    }
  }
}

let currentAuthProvider: AuthProvider = new SupabaseAuthProvider();

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
 * auto-provisions user in `public.users` database table, and attaches standard `req.user` payload.
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

    // Auto-provision public.users record only if not already cached in current process
    if (user.id && user.email && !provisionedUserIds.has(user.id)) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          create: { id: user.id, email: user.email },
          update: { email: user.email },
        });
        provisionedUserIds.add(user.id);
      } catch (err: any) {
        console.warn(`User auto-provisioning warning for ${user.id}:`, err.message);
      }
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

