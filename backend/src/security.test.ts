import test from 'node:test';
import assert from 'node:assert/strict';
import { importUrlsSchema } from './validators/import.schema.js';
import { fetchPublicHtml, UnsafeUrlError } from './utils/safeFetch.js';

test('URL import accepts only bounded HTTP(S) batches', () => {
  assert.equal(importUrlsSchema.safeParse({ urls: ['https://example.com'] }).success, true);
  assert.equal(importUrlsSchema.safeParse({ urls: ['file:///etc/passwd'] }).success, false);
  assert.equal(importUrlsSchema.safeParse({ urls: Array(101).fill('https://example.com') }).success, false);
});

test('metadata fetch rejects loopback and private IPv4 destinations', async () => {
  for (const url of ['http://127.0.0.1', 'http://10.0.0.1', 'http://169.254.169.254']) {
    await assert.rejects(fetchPublicHtml(url), UnsafeUrlError);
  }
});

test('metadata fetch rejects loopback IPv6 destinations', async () => {
  await assert.rejects(fetchPublicHtml('http://[::1]'), UnsafeUrlError);
});
