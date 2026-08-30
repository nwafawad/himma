import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { upsertProfileInputSchema } from '@himma/contracts';
import { LocalUploadStorage } from './infrastructure/storage/localUploadStorage.js';

test('LocalUploadStorage persists an avatar below its configured root', async (context) => {
  const rootDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'himma-storage-'));
  context.after(() => fs.rm(rootDirectory, { recursive: true, force: true }));

  const storage = new LocalUploadStorage(rootDirectory);
  const stored = await storage.storeAvatar({
    userId: '98e98020-4f93-4af1-894c-509ed7269347',
    buffer: Buffer.from('image bytes'),
    mimetype: 'image/png',
    size: 11,
  });

  assert.match(stored.url, /^\/uploads\/avatars\/avatar-[a-zA-Z0-9-]+\.png$/);
  const saved = await fs.readFile(path.join(rootDirectory, 'avatars', stored.filename));
  assert.equal(saved.toString(), 'image bytes');
});

test('LocalUploadStorage rejects unsupported avatar formats', async () => {
  const storage = new LocalUploadStorage(os.tmpdir());
  await assert.rejects(
    storage.storeAvatar({
      userId: 'user-id',
      buffer: Buffer.from('<svg />'),
      mimetype: 'image/svg+xml',
      size: 7,
    }),
    /Unsupported avatar image type/
  );
});

test('profile validation accepts hosted avatar paths and rejects arbitrary relative paths', () => {
  assert.equal(
    upsertProfileInputSchema.safeParse({ avatarUrl: '/uploads/avatars/avatar-user-id.png' }).success,
    true
  );
  assert.equal(upsertProfileInputSchema.safeParse({ avatarUrl: '../../private/file' }).success, false);
});
