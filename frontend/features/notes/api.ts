import { notesResponseSchema, type NotesResponse } from '@himma/contracts';
import { fetchApi } from '@/lib/api';

export interface ListNotesParams {
  limit?: number;
  offset?: number;
  tag?: string;
  linkedActivityId?: string;
}

export async function listNotes(params: ListNotesParams = {}): Promise<NotesResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
  if (params.tag) searchParams.set('tag', params.tag);
  if (params.linkedActivityId) searchParams.set('linkedActivityId', params.linkedActivityId);

  const query = searchParams.toString();
  const response = await fetchApi<unknown>(`/notes${query ? `?${query}` : ''}`);
  return notesResponseSchema.parse(response);
}
