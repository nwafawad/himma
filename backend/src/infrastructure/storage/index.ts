import path from 'path';
import { env } from '../../config/env.js';
import { LocalUploadStorage } from './localUploadStorage.js';

export const uploadRootDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);

export const uploadStorage = new LocalUploadStorage(uploadRootDirectory);

export type { StoreAvatarInput, StoredUpload, UploadStorage } from './storage.js';
