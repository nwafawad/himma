import {
  avatarUploadResponseSchema,
  profileResponseSchema,
  type AvatarUploadResponse,
  type ProfileResponse,
  type UpsertProfileInput,
} from '@himma/contracts';
import { fetchApi } from '@/lib/api';

export async function getProfile(): Promise<ProfileResponse> {
  return profileResponseSchema.parse(await fetchApi<unknown>('/profile'));
}

export async function upsertProfile(input: UpsertProfileInput): Promise<ProfileResponse> {
  const response = await fetchApi<unknown>('/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return profileResponseSchema.parse(response);
}

export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await fetchApi<unknown>('/upload/avatar', { method: 'POST', body: formData });
  return avatarUploadResponseSchema.parse(response);
}

export const exportUserData = (): Promise<unknown> => fetchApi<unknown>('/user/export');
