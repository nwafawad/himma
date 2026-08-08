/**
 * @file import.service.ts
 * @description Service handling browser history imports, pasted URLs parsing, staging candidates, and candidate approval/confirmation.
 */

import { prisma } from '../config/prisma.js';
import { ActivityType, ActivitySource } from '@prisma/client';
import { canonicalizeUrl, normalizeTitle } from '../utils/url.js';

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
 * Candidates are staged in a `pending` status after deduplicating against existing saved activities,
 * existing pending candidates, and within the incoming batch itself.
 *
 * @param userId - Unique identifier of the user staging the items.
 * @param items - Array of candidate items containing title, optional URL, type, and consumption timestamp.
 * @returns Object containing array of pending import candidate records and deduplication statistics.
 */
export const stageCandidates = async (
  userId: string,
  items: Array<{ title: string; url?: string; type?: ActivityType; consumedAt?: Date }>
) => {
  const totalParsed = items.length;

  // 1. Extract batch URLs and titles to perform O(K) targeted database lookup (supporting millions of DB rows)
  const batchRawUrls = items.map((i) => (i.url ? i.url.trim() : null)).filter((u): u is string => Boolean(u));
  const batchTitles = items.map((i) => i.title.trim()).filter(Boolean);

  const [existingActivities, existingCandidates] = await Promise.all([
    prisma.activityEntry.findMany({
      where: {
        userId,
        OR: [
          ...(batchRawUrls.length > 0 ? [{ url: { in: batchRawUrls } }] : []),
          ...(batchTitles.length > 0 ? [{ title: { in: batchTitles } }] : []),
        ],
      },
      select: { url: true, title: true },
    }),
    prisma.importCandidate.findMany({
      where: {
        userId,
        status: 'pending',
        OR: [
          ...(batchRawUrls.length > 0 ? [{ url: { in: batchRawUrls } }] : []),
          ...(batchTitles.length > 0 ? [{ title: { in: batchTitles } }] : []),
        ],
      },
      select: { url: true, title: true },
    }),
  ]);

  const existingCanonicalUrls = new Set<string>();
  const existingNormalizedTitles = new Set<string>();

  for (const act of existingActivities) {
    if (act.url) existingCanonicalUrls.add(canonicalizeUrl(act.url));
    if (act.title) existingNormalizedTitles.add(normalizeTitle(act.title));
  }

  for (const cand of existingCandidates) {
    if (cand.url) existingCanonicalUrls.add(canonicalizeUrl(cand.url));
    if (cand.title) existingNormalizedTitles.add(normalizeTitle(cand.title));
  }

  // 2. Perform in-memory deduplication against existing DB items and within incoming batch
  const batchCanonicalUrls = new Set<string>();
  const batchNormalizedTitles = new Set<string>();

  const candidatesData: Array<{
    userId: string;
    title: string;
    url: string | null;
    type: ActivityType;
    source: ActivitySource;
    consumedAt: Date;
    status: 'pending';
  }> = [];

  let duplicatesSkipped = 0;

  for (const item of items) {
    const rawUrl = item.url ? item.url.trim() : null;
    const canUrl = rawUrl ? canonicalizeUrl(rawUrl) : '';
    const normTitle = normalizeTitle(item.title);

    // Duplicate check
    const isDuplicateUrl = canUrl !== '' && (existingCanonicalUrls.has(canUrl) || batchCanonicalUrls.has(canUrl));
    const isDuplicateTitle = !canUrl && normTitle !== '' && (existingNormalizedTitles.has(normTitle) || batchNormalizedTitles.has(normTitle));

    if (isDuplicateUrl || isDuplicateTitle) {
      duplicatesSkipped++;
      continue;
    }

    // Register into batch tracking sets
    if (canUrl) batchCanonicalUrls.add(canUrl);
    if (normTitle) batchNormalizedTitles.add(normTitle);

    candidatesData.push({
      userId,
      title: item.title,
      url: rawUrl,
      type: item.type || inferActivityType(rawUrl || undefined),
      source: ActivitySource.import,
      consumedAt: item.consumedAt || new Date(),
      status: 'pending' as const,
    });
  }

  // 3. Create staging records for unique items
  if (candidatesData.length > 0) {
    await prisma.importCandidate.createMany({
      data: candidatesData,
    });
  }

  const pendingCandidates = await prisma.importCandidate.findMany({
    where: { userId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
  });

  return {
    candidates: pendingCandidates,
    stats: {
      totalParsed,
      stagedCount: candidatesData.length,
      duplicatesSkipped,
    },
  };
};

/**
 * Helper to check if a URL is noise (search engine query, login page, local file, social media feed).
 */
const isNoiseUrl = (urlStr?: string): boolean => {
  if (!urlStr) return true;
  const lower = urlStr.toLowerCase();
  return (
    lower.startsWith('chrome://') ||
    lower.startsWith('about:') ||
    lower.startsWith('file://') ||
    lower.includes('google.com/search') ||
    lower.includes('bing.com/search') ||
    lower.includes('duckduckgo.com/?q=') ||
    lower.includes('/login') ||
    lower.includes('/signin') ||
    lower.includes('/oauth') ||
    lower.includes('/auth/') ||
    lower.includes('facebook.com') ||
    lower.includes('instagram.com')
  );
};

/**
 * Parses and validates raw browser history JSON content and stages valid entries as candidates.
 * Capable of handling large 9MB+ history JSON exports with 30,000+ entries by filtering noise.
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

  // Filter & normalize entries from large exports (e.g. 9MB files with 30k+ history logs)
  const candidateItems: Array<{ title: string; url?: string; type?: ActivityType; consumedAt?: Date }> = [];

  for (const entry of parsedRaw) {
    const rawUrl = entry?.url || entry?.uri || entry?.href;
    if (!rawUrl || isNoiseUrl(rawUrl)) continue;

    const rawTitle = entry?.title || entry?.name || entry?.text || rawUrl;
    const rawDate = entry?.consumedAt || entry?.lastVisitTime || entry?.date || entry?.time;
    let consumedAt = new Date();
    if (rawDate) {
      const parsedDate = new Date(typeof rawDate === 'number' && rawDate < 1e12 ? rawDate * 1000 : rawDate);
      if (!isNaN(parsedDate.getTime())) {
        consumedAt = parsedDate;
      }
    }

    candidateItems.push({
      title: String(rawTitle).trim(),
      url: String(rawUrl).trim(),
      type: entry?.type || inferActivityType(rawUrl),
      consumedAt,
    });

    // Limit candidate staging pool to top 300 relevant learning items to keep UI & DB fast
    if (candidateItems.length >= 300) break;
  }

  if (candidateItems.length === 0) {
    throw new Error('NO_VALID_ENTRIES: No valid study history items found in the uploaded file.');
  }

  return stageCandidates(userId, candidateItems);
};

/**
 * Resolves shortened/compressed URLs and fetches OpenGraph/HTML title metadata.
 *
 * @param urlStr - Target URL string to resolve.
 * @returns Object containing canonical resolvedUrl and extracted human-readable title.
 */
const resolveUrlMetadata = async (urlStr: string): Promise<{ resolvedUrl: string; title: string }> => {
  let resolvedUrl = urlStr;
  let title = urlStr;

  try {
    const parsed = new URL(urlStr);
    title = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');

    const response = await fetch(urlStr, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (response.url) {
      resolvedUrl = response.url;
    }

    if (response.ok) {
      const htmlText = await response.text();
      const ogTitleMatch = htmlText.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                           htmlText.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      const titleTagMatch = htmlText.match(/<title[^>]*>([^<]+)<\/title>/i);

      const extractedTitle = ogTitleMatch?.[1] || titleTagMatch?.[1];
      if (extractedTitle && extractedTitle.trim()) {
        title = extractedTitle.trim();
      }
    }
  } catch (_) {
    // Fallback to default hostname/pathname if external fetch times out or fails
  }

  return { resolvedUrl, title };
};

/**
 * Parses a list of pasted URL strings into candidate items (unshortening URLs, inferring titles and activity types) and stages them.
 *
 * @param userId - Unique identifier of the user submitting pasted URLs.
 * @param urls - Array of URL strings to parse and stage.
 * @returns Array of staged pending candidate records.
 */
export const parseAndStagePastedUrls = async (userId: string, urls: string[]) => {
  const items = await Promise.all(
    urls.map(async (urlStr) => {
      const { resolvedUrl, title } = await resolveUrlMetadata(urlStr);
      return {
        title,
        url: resolvedUrl,
        type: inferActivityType(resolvedUrl),
        consumedAt: new Date(),
      };
    })
  );

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

