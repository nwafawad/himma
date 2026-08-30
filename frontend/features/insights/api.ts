import {
  generateInsightResponseSchema,
  insightsResponseSchema,
  type FeedbackInput,
  type GenerateInsightResponse,
  type InsightsResponse,
} from '@himma/contracts';
import { fetchApi } from '@/lib/api';

export async function listInsights(limit?: number, offset?: number): Promise<InsightsResponse> {
  const searchParams = new URLSearchParams();
  if (limit !== undefined) searchParams.set('limit', String(limit));
  if (offset !== undefined) searchParams.set('offset', String(offset));
  const query = searchParams.toString();
  const response = await fetchApi<unknown>(`/insights${query ? `?${query}` : ''}`);
  return insightsResponseSchema.parse(response);
}

export async function generateInsight(timeframeDays = 30): Promise<GenerateInsightResponse> {
  const response = await fetchApi<unknown>('/insights/generate', {
    method: 'POST',
    body: JSON.stringify({ timeframeDays }),
  });
  return generateInsightResponseSchema.parse(response);
}

export async function submitInsightFeedback(insightId: string, input: FeedbackInput): Promise<void> {
  await fetchApi(`/insights/${insightId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
