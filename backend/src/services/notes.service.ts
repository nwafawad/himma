import { prisma } from '../config/prisma.js';
import { CreateNoteInput, UpdateNoteInput } from '../validators/notes.schema.js';

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

export const getNoteByIdAndUser = async (id: string, userId: string) => {
  return prisma.noteEntry.findFirst({
    where: { id, userId },
    include: { linkedActivity: true },
  });
};

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

export const deleteNoteForUser = async (id: string, userId: string) => {
  const existing = await prisma.noteEntry.findFirst({ where: { id, userId } });
  if (!existing) return false;

  await prisma.noteEntry.delete({ where: { id } });
  return true;
};
