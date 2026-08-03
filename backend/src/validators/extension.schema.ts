import { z } from 'zod';

export const trackDomainSchema = z.object({
  domain: z.string().min(1, 'Domain name is required'),
  title: z.string().optional(),
  url: z.string().url('Invalid URL format'),
  dwellTimeSeconds: z.number().int().nonnegative().optional(),
});

export type TrackDomainInput = z.infer<typeof trackDomainSchema>;
