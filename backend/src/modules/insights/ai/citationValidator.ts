/**
 * @file citationValidator.ts
 * @description Utility module validating citation UUIDs returned by AI models against actual database entry UUIDs.
 */

/**
 * Result structure returned by citation validation check.
 */
export interface CitationValidationResult {
  /** Indicates whether all provided citations exist in the set of valid UUIDs */
  isValid: boolean;
  /** Array of citation UUIDs that were not found in the valid set */
  invalidIds: string[];
}

/**
 * Validates that all citation IDs returned by an LLM correspond to real user entry UUIDs.
 *
 * @param citations - Array of citation UUID strings returned by the AI.
 * @param validUuids - Set of valid ActivityEntry and NoteEntry UUIDs present in user context.
 * @returns CitationValidationResult object indicating overall validity and any invalid IDs found.
 */
export const validateCitations = (
  citations: string[],
  validUuids: Set<string>
): CitationValidationResult => {
  const invalidIds = citations.filter((id) => !validUuids.has(id));
  return {
    isValid: invalidIds.length === 0,
    invalidIds,
  };
};
