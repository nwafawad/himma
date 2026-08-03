import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { getOrCreateRollingDigest, RollingDigestSummary } from './digest.service.js';

export interface UserContextResult {
  skipped: boolean;
  reason: string | null;
  profile: any;
  activities: any[];
  notes: any[];
  digest: RollingDigestSummary | null;
  validUuids: Set<string>;
}

/**
 * Context Builder: Fetches logs & profile, checks configurable thresholds, attaches rolling profile digest, and trims context.
 */
export const buildUserContext = async (
  userId: string,
  timeframeDays = 30
): Promise<UserContextResult> => {
  const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

  const [profile, activities, notes, digest] = await Promise.all([
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
    getOrCreateRollingDigest(userId, cutoffDate),
  ]);

  const minActivities = env.MIN_INSIGHT_ACTIVITIES;
  const minNotes = env.MIN_INSIGHT_NOTES;

  if (activities.length < minActivities && notes.length < minNotes) {
    return {
      skipped: true,
      reason: `INSUFFICIENT_ACTIVITY_LOGS: User has ${activities.length} activities (min ${minActivities}) and ${notes.length} notes (min ${minNotes}) in recent ${timeframeDays}-day timeframe.`,
      profile,
      activities,
      notes,
      digest,
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
    digest,
    validUuids,
  };
};
