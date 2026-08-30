import { activitiesResponseSchema, type ActivitiesResponse } from '@himma/contracts';
import { fetchApi } from '@/lib/api';

export interface ListActivitiesParams {
  limit?: number;
  offset?: number;
  type?: string;
  tag?: string;
}

export async function listActivities(params: ListActivitiesParams = {}): Promise<ActivitiesResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
  if (params.type) searchParams.set('type', params.type);
  if (params.tag) searchParams.set('tag', params.tag);

  const query = searchParams.toString();
  const response = await fetchApi<unknown>(`/activities${query ? `?${query}` : ''}`);
  return activitiesResponseSchema.parse(response);
}
