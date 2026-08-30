/**
 * @file extension.controller.ts
 * @description HTTP route handlers for browser extension domain tracking and passive capture allowlist endpoints.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Default domain allowlist for passive browser activity tracking.
 */
const DEFAULT_ALLOWLIST = [
  'github.com',
  'youtube.com',
  'coursera.org',
  'udemy.com',
  'medium.com',
  'dev.to',
  'stackoverflow.com',
  'arxiv.org',
];

/**
 * Handles POST `/api/extension/track-domain` request to record domain navigation events from the browser extension.
 * Evaluates the domain against the passive tracking allowlist.
 *
 * @param req - Express Request object containing authenticated `req.user` and tracking payload in body.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const trackDomain = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { domain, title, url, dwellTimeSeconds } = req.body;

  try {
    const isAllowed = DEFAULT_ALLOWLIST.some((allowed) => domain.includes(allowed));

    return res.status(202).json({
      message: isAllowed
        ? 'Domain event logged for Phase 2 passive tracking pipeline.'
        : 'Domain skipped (not on passive tracking allowlist).',
      tracked: isAllowed,
      data: {
        userId,
        domain,
        title: title || null,
        url,
        dwellTimeSeconds: dwellTimeSeconds || 0,
        capturedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET `/api/extension/allowlist` request to fetch the current domain allowlist for browser extension configuration.
 *
 * @param _req - Express Request object.
 * @param res - Express Response object.
 * @param next - Express NextFunction error handler callback.
 */
export const getAllowlist = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json({
      allowlist: DEFAULT_ALLOWLIST,
    });
  } catch (error) {
    next(error);
  }
};
