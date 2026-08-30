import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import {
  supportedAvatarMimeTypes,
  type StoreAvatarInput,
  type StoredUpload,
  type UploadStorage,
} from './storage.js';

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export class LocalUploadStorage implements UploadStorage {
  public readonly rootDirectory: string;

  constructor(rootDirectory: string) {
    this.rootDirectory = path.resolve(rootDirectory);
  }

  async storeAvatar(input: StoreAvatarInput): Promise<StoredUpload> {
    const extension = extensionByMimeType[input.mimetype];
    if (!supportedAvatarMimeTypes.has(input.mimetype) || !extension) {
      throw new Error('Unsupported avatar image type.');
    }

    const avatarDirectory = path.join(this.rootDirectory, 'avatars');
    await fs.mkdir(avatarDirectory, { recursive: true });

    const safeUserId = input.userId.replace(/[^a-zA-Z0-9-]/g, '');
    const filename = `avatar-${safeUserId}-${randomUUID()}${extension}`;
    await fs.writeFile(path.join(avatarDirectory, filename), input.buffer, { flag: 'wx' });

    return {
      url: `/uploads/avatars/${filename}`,
      filename,
      size: input.size,
      mimetype: input.mimetype,
    };
  }
}
