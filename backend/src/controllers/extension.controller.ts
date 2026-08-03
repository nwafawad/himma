import { Request, Response, NextFunction } from 'express';

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

export const getAllowlist = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json({
      allowlist: DEFAULT_ALLOWLIST,
    });
  } catch (error) {
    next(error);
  }
};
