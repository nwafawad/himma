import { z } from 'zod';
import { ActivityType } from '@prisma/client';

export const importUrlsSchema = z.object({
  urls: z.array(
    z.string().url('Invalid URL format').refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === 'http:' || protocol === 'https:';
    }, 'Only HTTP and HTTPS URLs are supported')
  ).min(1, 'At least one URL must be provided').max(100, 'At most 100 URLs may be imported at once'),
});

export const browserHistoryItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url().optional(),
  consumedAt: z.string().optional(),
  type: z.nativeEnum(ActivityType).optional(),
});

export const browserHistoryExportSchema = z.array(browserHistoryItemSchema);

export const confirmImportSchema = z.object({
  approvedCandidateIds: z.array(z.string().uuid()).min(1, 'At least one candidate ID must be approved'),
  excludedCandidateIds: z.array(z.string().uuid()).optional().default([]),
});

export type ImportUrlsInput = z.infer<typeof importUrlsSchema>;
export type ConfirmImportInput = z.infer<typeof confirmImportSchema>;
