export interface CitationValidationResult {
  isValid: boolean;
  invalidIds: string[];
}

/**
 * Validates that all citations returned by LLM correspond to real user entry UUIDs.
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
