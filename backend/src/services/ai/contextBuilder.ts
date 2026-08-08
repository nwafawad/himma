/**
 * @file contextBuilder.ts
 * @description Context Builder component for assembling user activity logs, notes, skills profile, and historical digest.
 */

import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { getOrCreateRollingDigest, RollingDigestSummary } from './digest.service.js';

/**
 * Interface representing the assembled context for AI insight generation.
 */
export interface UserContextResult {
  /** Indicates whether insight generation should be skipped due to insufficient data */
  skipped: boolean;
  /** Human-readable explanation if skipped is true */
  reason: string | null;
  /** User's skills and goals profile record */
  profile: any;
  /** Array of activity entries within the timeframe window */
  activities: any[];
  /** Array of note entries within the timeframe window */
  notes: any[];
  /** Rolling digest summarizing activities/notes older than timeframe window */
  digest: RollingDigestSummary | null;
  /** Set of valid UUIDs belonging to user activities and notes for citation validation */
  validUuids: Set<string>;
}

/**
 * Assembles user context for AI analysis: fetches logs & profile, verifies configurable minimum threshold rules,
 * attaches rolling historical digest for entries older than recency window, and collects valid entry UUIDs.
 *
 * @param userId - Unique identifier of the user.
 * @param timeframeDays - Recency window in days for log retrieval (default: 30).
 * @returns Assembled UserContextResult object.
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

