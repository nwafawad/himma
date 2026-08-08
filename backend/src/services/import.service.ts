/**
 * @file import.service.ts
 * @description Service handling browser history imports, pasted URLs parsing, staging candidates, and candidate approval/confirmation.
 */

import { prisma } from '../config/prisma.js';
import { ActivityType, ActivitySource } from '@prisma/client';
import { browserHistoryExportSchema } from '../validators/import.schema.js';

/**
 * Infers an activity type enum based on domain/keyword patterns in a given URL.
 *
 * @param url - Optional target URL string to evaluate.
 * @returns Inferred ActivityType enum value (video, course, repository, article, or other).
 */
const inferActivityType = (url?: string): ActivityType => {
  if (!url) return ActivityType.other;
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('vimeo.com') || lower.includes('youtu.be')) {
    return ActivityType.video;
  }
  if (lower.includes('coursera.org') || lower.includes('udemy.com') || lower.includes('edx.org')) {
    return ActivityType.course;
  }
  if (lower.includes('github.com') || lower.includes('gitlab.com')) {
    return ActivityType.repository;
  }
  if (lower.includes('medium.com') || lower.includes('dev.to') || lower.includes('arxiv.org') || lower.includes('blog')) {
    return ActivityType.article;
  }
  return ActivityType.other;
};

/**
 * Stages parsed import candidates into the `import_candidates` staging database table.
 * Candidates are staged in a `pending` status and are NEVER saved to `ActivityEntry` records directly.
 *
 * @param userId - Unique identifier of the user staging the items.
 * @param items - Array of candidate items containing title, optional URL, type, and consumption timestamp.
 * @returns Array of pending import candidate records for the user.
 */
export const stageCandidates = async (
  userId: string,
  items: Array<{ title: string; url?: string; type?: ActivityType; consumedAt?: Date }>
) => {
  const candidatesData = items.map((item) => ({
    userId,
    title: item.title,
    url: item.url || null,
    type: item.type || inferActivityType(item.url),
    source: ActivitySource.import,
    consumedAt: item.consumedAt || new Date(),
    status: 'pending' as const,
  }));

  // Create staging records
  await prisma.importCandidate.createMany({
    data: candidatesData,
  });

  return prisma.importCandidate.findMany({
    where: { userId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Parses and validates raw browser history JSON content and stages valid entries as candidates.
 *
 * @param userId - Unique identifier of the user uploading browser history.
 * @param fileContent - Raw JSON string containing exported browser history entries.
 * @returns Array of staged pending candidate records.
 * @throws Error if JSON format is invalid or schema validation fails.
 */
export const parseAndStageBrowserHistory = async (userId: string, fileContent: string) => {
  let parsedRaw: any;
  try {
    parsedRaw = JSON.parse(fileContent);
  } catch (err) {
    throw new Error('INVALID_FILE_FORMAT: Uploaded file is not valid JSON.');
  }

  if (!Array.isArray(parsedRaw)) {
    throw new Error('INVALID_SCHEMA: Browser history export must be a JSON array of entries.');
  }

  const validationResult = browserHistoryExportSchema.safeParse(parsedRaw);
  if (!validationResult.success) {
    throw new Error(`INVALID_SCHEMA: File content does not match expected browser history schema: ${validationResult.error.message}`);
  }

  const items = validationResult.data.map((entry) => ({
    title: entry.title,
    url: entry.url,
    type: entry.type,
    consumedAt: entry.consumedAt ? new Date(entry.consumedAt) : new Date(),
  }));

  return stageCandidates(userId, items);
};

/**
 * Parses a list of pasted URL strings into candidate items (inferring titles and activity types) and stages them.
 *
 * @param userId - Unique identifier of the user submitting pasted URLs.
 * @param urls - Array of URL strings to parse and stage.
 * @returns Array of staged pending candidate records.
 */
export const parseAndStagePastedUrls = async (userId: string, urls: string[]) => {
  const items = urls.map((urlStr) => {
    let title = urlStr;
    try {
      const parsed = new URL(urlStr);
      title = parsed.hostname + parsed.pathname;
    } catch (_) {}
    return {
      title,
      url: urlStr,
      type: inferActivityType(urlStr),
      consumedAt: new Date(),
    };
  });

  return stageCandidates(userId, items);
};

/**
 * Retrieves all currently staged pending candidates for a specified user.
 *
 * @param userId - Unique identifier of the user.
 * @returns Array of pending import candidates ordered by creation date descending.
 */
export const getPendingCandidates = async (userId: string) => {
  return prisma.importCandidate.findMany({
    where: { userId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Confirms import selections by transactionally persisting approved candidates to `ActivityEntry`
 * records and updating candidate status to `approved` or `rejected`.
 *
 * @param userId - Unique identifier of the user confirming the import.
 * @param approvedCandidateIds - Array of candidate IDs to convert into activity entries.
 * @param excludedCandidateIds - Optional array of candidate IDs to mark as rejected.
 * @returns Array of newly created `ActivityEntry` records.
 */
export const confirmImportCandidates = async (
  userId: string,
  approvedCandidateIds: string[],
  excludedCandidateIds: string[] = []
) => {
  return prisma.$transaction(async (tx) => {
    // Reject excluded candidates
    if (excludedCandidateIds.length > 0) {
      await tx.importCandidate.updateMany({
        where: { id: { in: excludedCandidateIds }, userId },
        data: { status: 'rejected' },
      });
    }

    // Fetch approved candidates
    const candidatesToApprove = await tx.importCandidate.findMany({
      where: { id: { in: approvedCandidateIds }, userId, status: 'pending' },
    });

    if (candidatesToApprove.length === 0) {
      return [];
    }

    // Transactionally create ActivityEntry records and mark candidates as approved
    const createdActivities = [];
    for (const c of candidatesToApprove) {
      const activity = await tx.activityEntry.create({
        data: {
          userId,
          title: c.title,
          url: c.url,
          type: c.type,
          source: ActivitySource.import,
          tags: c.tags,
          consumedAt: c.consumedAt,
        },
      });
      createdActivities.push(activity);
    }

    await tx.importCandidate.updateMany({
      where: { id: { in: candidatesToApprove.map((c) => c.id) }, userId },
      data: { status: 'approved' },
    });

    return createdActivities;
  });
};

