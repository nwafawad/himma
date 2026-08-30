import { z } from 'zod';
import { activitySchema } from './activities.js';
import { paginatedResponseSchema, uuidSchema } from './common.js';

export const noteSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  text: z.string(),
  tags: z.array(z.string()),
  linkedActivityId: uuidSchema.nullable(),
  createdAt: z.string().datetime(),
  linkedActivity: activitySchema.nullable().optional(),
});

export const createNoteInputSchema = z.object({
  text: z.string().min(1, 'Note text is required'),
  tags: z.array(z.string()).optional().default([]),
  linkedActivityId: uuidSchema.optional().nullable(),
});

export const updateNoteInputSchema = createNoteInputSchema.partial();
export const notesResponseSchema = paginatedResponseSchema(noteSchema);

export type Note = z.infer<typeof noteSchema>;
export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;
export type NotesResponse = z.infer<typeof notesResponseSchema>;
