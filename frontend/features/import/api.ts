import {
  pendingCandidatesResponseSchema,
  stageImportResponseSchema,
  type ConfirmImportInput,
  type StageImportResponse,
} from '@himma/contracts';
import { fetchApi } from '@/lib/api';

export async function uploadHistory(file: File): Promise<StageImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetchApi<unknown>('/import/upload', { method: 'POST', body: formData });
  return stageImportResponseSchema.parse(response);
}

export async function stageUrls(urls: string[]): Promise<StageImportResponse> {
  const response = await fetchApi<unknown>('/import/urls', {
    method: 'POST',
    body: JSON.stringify({ urls }),
  });
  return stageImportResponseSchema.parse(response);
}

export async function listPendingCandidates() {
  const response = await fetchApi<unknown>('/import/candidates');
  return pendingCandidatesResponseSchema.parse(response);
}

export async function confirmImport(input: ConfirmImportInput): Promise<void> {
  await fetchApi('/import/confirm', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
