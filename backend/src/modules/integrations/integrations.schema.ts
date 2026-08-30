import { z } from 'zod';

export const oauthProviderParamSchema = z.object({
  provider: z.enum(['github', 'notion', 'coursera', 'youtube']),
});

export const syncIntegrationSchema = z.object({
  provider: z.enum(['github', 'notion', 'coursera', 'youtube']),
  forceFullSync: z.boolean().optional().default(false),
});

export type SyncIntegrationInput = z.infer<typeof syncIntegrationSchema>;
