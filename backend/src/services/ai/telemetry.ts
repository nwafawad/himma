/**
 * @file telemetry.ts
 * @description Telemetry data structures and factory functions tracking AI pipeline performance and execution status.
 */

/**
 * Interface representing telemetry recorded during an AI Insight Engine pipeline run.
 */
export interface TelemetryData {
  /** Pipeline duration in milliseconds */
  durationMs: number;
  /** Total tokens consumed during LLM call (if available) */
  tokensUsed?: number;
  /** Status indicator of execution outcome */
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED' | 'RETRY_SUCCESS' | 'DEV_FALLBACK';
  /** Number of retries performed during run */
  retryCount: number;
  /** Name of model used for generation */
  modelUsed: string;
}

/**
 * Factory function creating a standardized TelemetryData object.
 *
 * @param startTime - Epoch timestamp (in ms) recorded when pipeline execution started.
 * @param tokensUsed - Number of tokens consumed during generation.
 * @param status - Pipeline status outcome.
 * @param retryCount - Number of retries executed.
 * @param modelUsed - Model identifier string.
 * @returns Populated TelemetryData object with computed duration.
 */
export const createTelemetry = (
  startTime: number,
  tokensUsed: number,
  status: TelemetryData['status'],
  retryCount: number,
  modelUsed: string
): TelemetryData => {
  return {
    durationMs: Date.now() - startTime,
    tokensUsed,
    status,
    retryCount,
    modelUsed,
  };
};

