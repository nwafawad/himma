/**
 * @file digest.service.ts
 * @description Service to aggregate and persist rolling profile digests for user activities and notes older than the recency window.
 */

import { prisma } from '../../config/prisma.js';

/**
 * Summary structure representing historical activity counts, top tags, and time period covered.
 */
export interface RollingDigestSummary {
  /** Count of historical activity entries older than recency window */
  historicalActivityCount: number;
  /** Count of historical note entries older than recency window */
  historicalNoteCount: number;
  /** Array of top 10 most frequent tags across historical entries */
  topTags: string[];
  /** Period covered start and end ISO timestamp strings */
  periodCovered: { start: string | null; end: string | null };
}

/**
 * Retrieves an existing rolling profile digest for entries older than `cutoffDate`,
 * or aggregates historical activities/notes and creates a new `ProfileDigest` record.
 *
 * @param userId - Unique identifier of the target user.
 * @param cutoffDate - Cutoff Date threshold distinguishing recent entries from historical entries.
 * @returns RollingDigestSummary object if historical data exists, or null if no historical entries exist.
 */
export const getOrCreateRollingDigest = async (
  userId: string,
  cutoffDate: Date
): Promise<RollingDigestSummary | null> => {
  // Check for existing recent profile digest
  const existingDigest = await prisma.profileDigest.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (existingDigest) {
    return existingDigest.digestSummary as unknown as RollingDigestSummary;
  }

  // Aggregate older activities and notes
  const [olderActivities, olderNotes] = await Promise.all([
    prisma.activityEntry.findMany({
      where: { userId, consumedAt: { lt: cutoffDate } },
      select: { tags: true, consumedAt: true },
    }),
    prisma.noteEntry.findMany({
      where: { userId, createdAt: { lt: cutoffDate } },
      select: { tags: true, createdAt: true },
    }),
  ]);

  if (olderActivities.length === 0 && olderNotes.length === 0) {
    return null;
  }

  const tagCounts: Record<string, number> = {};
  [...olderActivities, ...olderNotes].forEach((entry) => {
    (entry.tags || []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  const digestSummary: RollingDigestSummary = {
    historicalActivityCount: olderActivities.length,
    historicalNoteCount: olderNotes.length,
    topTags: sortedTags,
    periodCovered: {
      start: olderActivities.length > 0 ? olderActivities[olderActivities.length - 1].consumedAt.toISOString() : null,
      end: cutoffDate.toISOString(),
    },
  };

  await prisma.profileDigest.create({
    data: {
      userId,
      periodStart: olderActivities.length > 0 ? olderActivities[olderActivities.length - 1].consumedAt : new Date(0),
      periodEnd: cutoffDate,
      digestSummary: digestSummary as any,
    },
  });

  return digestSummary;
};

