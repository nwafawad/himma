import { z } from 'zod';

export const createNoteSchema = z.object({
  text: z.string().min(1, 'Note text is required'),
  tags: z.array(z.string()).optional().default([]),
  linkedActivityId: z.string().uuid('Invalid activity UUID format').optional().nullable(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid record UUID format'),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
