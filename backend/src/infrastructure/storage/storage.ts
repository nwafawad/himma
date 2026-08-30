export const avatarMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const supportedAvatarMimeTypes = new Set<string>(avatarMimeTypes);

export interface StoreAvatarInput {
  userId: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface StoredUpload {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

/**
 * Persistence boundary for user-uploaded assets.
 *
 * The local adapter is used in development. A production object-storage
 * adapter can implement the same contract without changing HTTP routes.
 */
export interface UploadStorage {
  storeAvatar(input: StoreAvatarInput): Promise<StoredUpload>;
}
