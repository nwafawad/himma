import { z } from 'zod';
import { AlignmentScore } from '@prisma/client';

export const createInsightRunSchema = z.object({
  inputWindow: z.record(z.any()).optional().default({}),
  skillSummary: z.record(z.any()),
  directionSummary: z.record(z.any()),
  alignmentScore: z.nativeEnum(AlignmentScore),
  citations: z.union([z.array(z.string()), z.record(z.any())]).optional().default([]),
});

export type CreateInsightRunInput = z.infer<typeof createInsightRunSchema>;
