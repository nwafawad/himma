import { prisma } from '../config/prisma.js';
import { ActivityType, ActivitySource } from '@prisma/client';
import { browserHistoryExportSchema } from '../validators/import.schema.js';

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
 * Stage parsed import candidates into the import_candidates staging table.
 * Candidates are NEVER auto-saved to ActivityEntry records directly.
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
 * Parse and validate browser history export content.
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
 * Parse pasted URLs into title/domain candidates and stage them.
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
 * Retrieve current staged pending candidates for a user.
 */
export const getPendingCandidates = async (userId: string) => {
  return prisma.importCandidate.findMany({
    where: { userId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Confirm import: Persist approved candidates to ActivityEntry and reject excluded candidates.
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
