import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activitiesResponseSchema,
  authSessionResponseSchema,
  importUrlsInputSchema,
  insightSchema,
} from '../dist/index.js';

const id = '98e98020-4f93-4af1-894c-509ed7269347';
const timestamp = '2026-08-30T10:00:00.000Z';

test('activities response contract accepts the serialized API shape', () => {
  const result = activitiesResponseSchema.safeParse({
    data: [{
      id,
      userId: id,
      source: 'manual',
      title: 'Read a systems paper',
      url: 'https://example.com/paper',
      type: 'article',
      tags: ['systems'],
      consumedAt: timestamp,
      createdAt: timestamp,
    }],
    pagination: { total: 1, limit: 20, offset: 0, hasMore: false },
  });

  assert.equal(result.success, true);
});

test('auth response contract rejects malformed sessions', () => {
  assert.equal(authSessionResponseSchema.safeParse({ data: { token: '', user: {} } }).success, false);
});

test('insight contract supplies stable defaults for JSON summary objects', () => {
  const parsed = insightSchema.parse({
    id,
    timestamp,
    inputWindow: {},
    skillSummary: {},
    directionSummary: {},
    alignmentScore: 'no_stated_goal',
    citations: [],
    status: 'skipped',
    statusReason: 'Not enough activity',
    tokensUsed: 0,
  });

  assert.deepEqual(parsed.skillSummary.strong, []);
  assert.deepEqual(parsed.directionSummary.candidatePaths, []);
});

test('URL import contract permits only bounded HTTP(S) batches', () => {
  assert.equal(importUrlsInputSchema.safeParse({ urls: ['https://example.com'] }).success, true);
  assert.equal(importUrlsInputSchema.safeParse({ urls: ['file:///etc/passwd'] }).success, false);
});
