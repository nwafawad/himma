import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

/**
 * Decoupled User Interface representing authenticated identity across providers (Supabase Auth / Clerk).
 */
export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
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
 * Auth Provider interface abstraction.
 */
export interface AuthProvider {
  verifyToken(token: string): Promise<AuthUser | null>;
}

/**
 * Supabase Auth Provider implementation using @supabase/supabase-js.
 * Verifies JWT access tokens with Supabase Auth (supabase.auth.getUser).
 */
export class SupabaseAuthProvider implements AuthProvider {
  async verifyToken(token: string): Promise<AuthUser | null> {
    // Development mock token fallback for local dev & testing
    if (token === 'mock-supabase-token' || token === 'valid-scaffold-token') {
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
 * Configure active Auth Provider strategy.
 */
export const setAuthProvider = (provider: AuthProvider) => {
  currentAuthProvider = provider;
};

/**
 * Authentication middleware.
 * Extracts Bearer token, delegates verification to the configured AuthProvider,
 * and attaches standard `req.user` payload to Express request.
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = await currentAuthProvider.verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired authentication token.',
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
