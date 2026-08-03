export interface TelemetryData {
  durationMs: number;
  tokensUsed?: number;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED' | 'RETRY_SUCCESS' | 'DEV_FALLBACK';
  retryCount: number;
  modelUsed: string;
}

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
