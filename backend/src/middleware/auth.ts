import { Request, Response, NextFunction } from 'express';

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
 * Allows swapping Supabase Auth, Clerk, or custom JWT verifiers without changing route controllers.
 */
export interface AuthProvider {
  verifyToken(token: string): Promise<AuthUser | null>;
}

/**
 * Stub implementation of AuthProvider for scaffolding.
 * Provider implementations (e.g. SupabaseAuthProvider or ClerkAuthProvider) plug in here.
 */
class ScaffoldAuthProvider implements AuthProvider {
  async verifyToken(token: string): Promise<AuthUser | null> {
    // Scaffold implementation: returns dummy user if valid-looking token provided
    if (token === 'valid-scaffold-token') {
      return {
        id: 'scaffold-user-123',
        email: 'user@momentum.app',
        role: 'authenticated',
      };
    }
    return null;
  }
}

let currentAuthProvider: AuthProvider = new ScaffoldAuthProvider();

/**
 * Configure active Auth Provider strategy.
 */
export const setAuthProvider = (provider: AuthProvider) => {
  currentAuthProvider = provider;
};

/**
 * Authentication middleware scaffold.
 * Extracts Bearer token, delegates verification to the configured AuthProvider,
 * and attaches standard `req.user` payload.
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
