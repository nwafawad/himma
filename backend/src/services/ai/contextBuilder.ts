import { prisma } from '../../config/prisma.js';

export interface UserContextResult {
  skipped: boolean;
  reason: string | null;
  profile: any;
  activities: any[];
  notes: any[];
  validUuids: Set<string>;
}

/**
 * Context Builder: Fetches logs & profile, checks thresholds, and trims token context.
 */
export const buildUserContext = async (
  userId: string,
  timeframeDays = 30
): Promise<UserContextResult> => {
  const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

  const [profile, activities, notes] = await Promise.all([
    prisma.skillsGoalsProfile.findUnique({ where: { userId } }),
    prisma.activityEntry.findMany({
      where: { userId, consumedAt: { gte: cutoffDate } },
      orderBy: { consumedAt: 'desc' },
      take: 100,
    }),
    prisma.noteEntry.findMany({
      where: { userId, createdAt: { gte: cutoffDate } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  if (activities.length === 0 && notes.length === 0) {
    return {
      skipped: true,
      reason: 'INSUFFICIENT_ACTIVITY_LOGS',
      profile,
      activities: [],
      notes: [],
      validUuids: new Set<string>(),
    };
  }

  const validUuids = new Set<string>([
    ...activities.map((a) => a.id),
    ...notes.map((n) => n.id),
  ]);

  return {
    skipped: false,
    reason: null,
    profile,
    activities,
    notes,
    validUuids,
  };
};
