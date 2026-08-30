/**
 * @file auth.service.ts
 * @description Authentication service handling user registration, password hashing with bcrypt,
 * JWT token generation, and credential verification.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { LoginInput, SignUpInput } from '@himma/contracts';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';

export interface AuthSessionResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  };
}

/**
 * Generates a signed JWT access token for an authenticated user.
 */
export const generateToken = (payload: { id: string; email: string; role?: string }): string => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'authenticated',
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  );
};

/**
 * Registers a new user account with hashed password and auto-initializes their profile.
 *
 * @param input - Validated SignUpInput (email, password, optional name).
 * @returns Auth session containing JWT token and user info.
 */
export const registerUser = async (input: SignUpInput): Promise<AuthSessionResponse> => {
  const normalizedEmail = input.email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    Object.assign(error, { statusCode: 409, code: 'USER_ALREADY_EXISTS' });
    throw error;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(input.password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      name: input.name || null,
      profile: {
        create: {
          currentSkills: [],
          interests: [],
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  const token = generateToken({ id: newUser.id, email: newUser.email });

  return {
    token,
    user: newUser,
  };
};

/**
 * Authenticates user credentials and returns a valid session token upon success.
 *
 * @param input - Validated LoginInput (email, password).
 * @returns Auth session containing JWT token and user info.
 */
export const loginUser = async (input: LoginInput): Promise<AuthSessionResponse> => {
  const normalizedEmail = input.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.passwordHash) {
    const error = new Error('Invalid email or password.');
    Object.assign(error, { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    Object.assign(error, { statusCode: 401, code: 'INVALID_CREDENTIALS' });
    throw error;
  }

  const token = generateToken({ id: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
  };
};

/**
 * Retrieves the current authenticated user's record and profile.
 *
 * @param userId - Unique user ID from JWT token.
 * @returns Sanitized user profile data.
 */
export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      profile: {
        select: {
          avatarUrl: true,
          targetPath: true,
          currentSkills: true,
          interests: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found.');
    Object.assign(error, { statusCode: 404, code: 'USER_NOT_FOUND' });
    throw error;
  }

  return user;
};
