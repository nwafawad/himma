import { z } from 'zod';

export const feedbackSchema = z.object({
  action: z.enum(['confirm', 'correct']),
  correctedSkills: z.array(z.string()).optional(),
  correctedTargetPath: z.string().optional().nullable(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
