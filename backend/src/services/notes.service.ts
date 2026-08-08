/**
 * @file notes.service.ts
 * @description Service handling CRUD operations for user learning notes (NoteEntry).
 */

import { prisma } from '../config/prisma.js';
import { CreateNoteInput, UpdateNoteInput } from '../validators/notes.schema.js';

/**
 * Retrieves a paginated list of note entries for a specified user, with optional tag and activity link filters.
 *
 * @param userId - Unique identifier of the user whose notes to retrieve.
 * @param tag - Optional tag filter to search within the note's tags array.
 * @param linkedActivityId - Optional activity ID filter to retrieve notes linked to a specific activity.
 * @param limit - Maximum number of notes to return (default: 50).
 * @param offset - Number of records to skip for pagination (default: 0).
 * @returns Object containing the list of notes (with linked activity included) and total count.
 */
export const listNotes = async (
  userId: string,
  tag?: string,
  linkedActivityId?: string,
  limit = 50,
  offset = 0
) => {
  const where: any = { userId };
  if (tag) {
    where.tags = { has: tag };
  }
  if (linkedActivityId) {
    where.linkedActivityId = linkedActivityId;
  }

  const [notes, total] = await Promise.all([
    prisma.noteEntry.findMany({
      where,
      include: { linkedActivity: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.noteEntry.count({ where }),
  ]);

  return { notes, total };
};

/**
 * Creates a new note entry for a specified user, optionally linking it to an existing activity entry.
 *
 * @param userId - Unique identifier of the user creating the note.
 * @param input - Note creation payload (text, tags, linkedActivityId).
 * @returns The newly created note record including any linked activity.
 * @throws Error if `linkedActivityId` is provided but the activity entry is not found.
 */
export const createNoteForUser = async (userId: string, input: CreateNoteInput) => {
  const { text, tags, linkedActivityId } = input;

  if (linkedActivityId) {
    const activity = await prisma.activityEntry.findFirst({
      where: { id: linkedActivityId, userId },
    });
    if (!activity) {
      throw new Error('REFERENCED_ACTIVITY_NOT_FOUND');
    }
  }

  return prisma.noteEntry.create({
    data: {
      userId,
      text,
      tags: tags || [],
      linkedActivityId: linkedActivityId || null,
    },
    include: { linkedActivity: true },
  });
};

/**
 * Retrieves a single note entry by ID for a specific user.
 *
 * @param id - Unique identifier of the note entry.
 * @param userId - Unique identifier of the user who owns the note.
 * @returns The note record if found (including linked activity), or null otherwise.
 */
export const getNoteByIdAndUser = async (id: string, userId: string) => {
  return prisma.noteEntry.findFirst({
    where: { id, userId },
    include: { linkedActivity: true },
  });
};

/**
 * Updates an existing note entry for a specific user.
 *
 * @param id - Unique identifier of the note entry to update.
 * @param userId - Unique identifier of the user who owns the note.
 * @param input - Partial update payload for the note.
 * @returns The updated note record, or null if the note entry was not found.
 * @throws Error if `linkedActivityId` is provided but the activity entry is not found.
 */
export const updateNoteForUser = async (id: string, userId: string, input: UpdateNoteInput) => {
  const existing = await prisma.noteEntry.findFirst({ where: { id, userId } });
  if (!existing) return null;

  if (input.linkedActivityId) {
    const activity = await prisma.activityEntry.findFirst({
      where: { id: input.linkedActivityId, userId },
    });
    if (!activity) {
      throw new Error('REFERENCED_ACTIVITY_NOT_FOUND');
    }
  }

  return prisma.noteEntry.update({
    where: { id },
    data: {
      ...(input.text && { text: input.text }),
      ...(input.tags && { tags: input.tags }),
      ...(input.linkedActivityId !== undefined && { linkedActivityId: input.linkedActivityId }),
    },
    include: { linkedActivity: true },
  });
};

/**
 * Deletes a note entry owned by a specific user.
 *
 * @param id - Unique identifier of the note entry to delete.
 * @param userId - Unique identifier of the user who owns the note.
 * @returns True if deletion succeeded, false if note entry was not found.
 */
export const deleteNoteForUser = async (id: string, userId: string) => {
  const existing = await prisma.noteEntry.findFirst({ where: { id, userId } });
  if (!existing) return false;

  await prisma.noteEntry.delete({ where: { id } });
  return true;
};

