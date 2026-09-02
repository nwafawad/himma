import { z } from 'zod';
import { activitySourceSchema, activityTypeSchema } from './activities.js';
import { uuidSchema } from './common.js';

export const importUrlsInputSchema = z.object({
  urls: z.array(
    z.string().url('Invalid URL format').refine(
      (value) => /^https?:\/\//i.test(value),
      'Only HTTP and HTTPS URLs are supported'
    )
  ).min(1, 'At least one URL must be provided').max(100, 'At most 100 URLs may be imported at once'),
});

export const browserHistoryItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url().optional(),
  consumedAt: z.string().optional(),
  type: activityTypeSchema.optional(),
});

export const browserHistoryExportSchema = z.array(browserHistoryItemSchema);

export const candidateOverrideSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, 'Title cannot be empty').optional(),
  type: activityTypeSchema.optional(),
});

export const confirmImportInputSchema = z.object({
  approvedCandidateIds: z.array(uuidSchema).min(1, 'At least one candidate ID must be approved'),
  excludedCandidateIds: z.array(uuidSchema).optional(),
  overrides: z.array(candidateOverrideSchema).optional(),
});

export const importCandidateSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema.optional(),
  title: z.string(),
  url: z.string().url().nullable(),
  type: activityTypeSchema,
  source: activitySourceSchema.optional(),
  tags: z.array(z.string()).optional(),
  consumedAt: z.string().datetime(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  createdAt: z.string().datetime().optional(),
});

export const importStatsSchema = z.object({
  totalParsed: z.number().int().nonnegative(),
  stagedCount: z.number().int().nonnegative(),
  duplicatesSkipped: z.number().int().nonnegative(),
});

export const stageImportResponseSchema = z.object({
  data: z.array(importCandidateSchema),
  stats: importStatsSchema.optional(),
});

export const pendingCandidatesResponseSchema = z.object({
  data: z.array(importCandidateSchema),
});

export type ImportUrlsInput = z.infer<typeof importUrlsInputSchema>;
export type CandidateOverride = z.infer<typeof candidateOverrideSchema>;
export type ConfirmImportInput = z.infer<typeof confirmImportInputSchema>;
export type ImportCandidate = z.infer<typeof importCandidateSchema>;
export type ImportStats = z.infer<typeof importStatsSchema>;
export type StageImportResponse = z.infer<typeof stageImportResponseSchema>;
