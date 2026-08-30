import test from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { importUrlsSchema } from './validators/import.schema.js';
import { fetchPublicHtml, UnsafeUrlError } from './utils/safeFetch.js';
import { markDeprecatedRoute } from './middleware/deprecation.js';

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

test('legacy API routes advertise their canonical successor', () => {
  const headers = new Map<string, string>();
  let nextCalled = false;
  const request = { path: '/notes' } as Request;
  const response = {
    setHeader: (name: string, value: string) => headers.set(name, value),
    append: (name: string, value: string) => headers.set(name, value),
  } as unknown as Response;

  markDeprecatedRoute((path) => `/api/v1${path}`)(request, response, () => {
    nextCalled = true;
  });

  assert.equal(headers.get('X-API-Deprecated'), 'true');
  assert.equal(headers.get('Link'), '</api/v1/notes>; rel="successor-version"');
  assert.equal(nextCalled, true);
});
