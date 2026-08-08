/**
 * @file url.ts
 * @description Utility functions for URL canonicalization and title normalization to support deduplication.
 */

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'ref_src',
  'fbclid',
  'gclid',
  'session_id',
  'sid',
  'spm',
  'igshid',
  'mc_eid',
]);

/**
 * Strips tracking parameters, hash fragments, and trailing slashes to return a canonical URL.
 *
 * @param urlStr - Raw input URL string.
 * @returns Canonicalized URL string.
 */
export const canonicalizeUrl = (urlStr?: string | null): string => {
  if (!urlStr) return '';
  const trimmed = urlStr.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);

    // Strip tracking parameters
    for (const param of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_PARAMS.has(param.toLowerCase()) || param.toLowerCase().startsWith('utm_')) {
        parsed.searchParams.delete(param);
      }
    }

    // Sort search parameters for consistent order
    parsed.searchParams.sort();

    // Strip hash fragments
    parsed.hash = '';

    // Strip trailing slashes on pathname
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    return parsed.toString();
  } catch (_) {
    // If not a valid absolute URL, return trimmed lowercase version
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
};

/**
 * Normalizes title string for exact title deduplication fallback when URL is absent.
 *
 * @param title - Raw title string.
 * @returns Lowercase, whitespace-collapsed normalized title string.
 */
export const normalizeTitle = (title?: string | null): string => {
  if (!title) return '';
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};
