import { prisma } from '../config/prisma.js';
import { CreateActivityInput, UpdateActivityInput } from '../validators/activities.schema.js';
import { ActivityType } from '@prisma/client';

export const listActivities = async (
  userId: string,
  type?: ActivityType,
  tag?: string,
  limit = 50,
  offset = 0
) => {
  const where: any = { userId };
  if (type) {
    where.type = type;
  }
  if (tag) {
    where.tags = { has: tag };
  }

  const [activities, total] = await Promise.all([
    prisma.activityEntry.findMany({
      where,
      orderBy: { consumedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.activityEntry.count({ where }),
  ]);

  return { activities, total };
};

export const createActivityForUser = async (userId: string, input: CreateActivityInput) => {
  const { source, title, url, type, tags, consumedAt } = input;
  return prisma.activityEntry.create({
    data: {
      userId,
      source,
      title,
      url: url || null,
      type,
      tags: tags || [],
      consumedAt: consumedAt ? new Date(consumedAt) : new Date(),
    },
  });
};

export const getActivityByIdAndUser = async (id: string, userId: string) => {
  return prisma.activityEntry.findFirst({
    where: { id, userId },
    include: { notesLinked: true },
  });
};

export const updateActivityForUser = async (id: string, userId: string, input: UpdateActivityInput) => {
  const existing = await prisma.activityEntry.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return prisma.activityEntry.update({
    where: { id },
    data: {
      ...(input.source && { source: input.source }),
      ...(input.title && { title: input.title }),
      ...(input.url !== undefined && { url: input.url }),
      ...(input.type && { type: input.type }),
      ...(input.tags && { tags: input.tags }),
      ...(input.consumedAt && { consumedAt: new Date(input.consumedAt) }),
    },
  });
};

export const deleteActivityForUser = async (id: string, userId: string) => {
  const existing = await prisma.activityEntry.findFirst({ where: { id, userId } });
  if (!existing) return false;

  await prisma.activityEntry.delete({ where: { id } });
  return true;
};
