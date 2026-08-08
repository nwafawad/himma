/**
 * @file activities.service.ts
 * @description Service handling database CRUD operations for user learning activities (ActivityEntry).
 */

import { prisma } from '../config/prisma.js';
import { CreateActivityInput, UpdateActivityInput } from '../validators/activities.schema.js';
import { ActivityType } from '@prisma/client';

/**
 * Retrieves a paginated list of activity entries for a specified user, with optional filters.
 *
 * @param userId - Unique identifier of the user whose activities to retrieve.
 * @param type - Optional activity type filter (e.g. video, article, course).
 * @param tag - Optional tag filter to search within the activity's tags array.
 * @param limit - Maximum number of activities to return (default: 50).
 * @param offset - Number of records to skip for pagination (default: 0).
 * @param includeTotal - Whether to compute total record count (default: false).
 * @returns Object containing the list of activities, `hasMore` pagination flag, and optional total count.
 */
export const listActivities = async (
  userId: string,
  type?: ActivityType,
  tag?: string,
  limit = 50,
  offset = 0,
  includeTotal = false
) => {
  const where: any = { userId };
  if (type) {
    where.type = type;
  }
  if (tag) {
    where.tags = { has: tag };
  }

  const select = {
    id: true,
    userId: true,
    source: true,
    title: true,
    url: true,
    type: true,
    tags: true,
    consumedAt: true,
    createdAt: true,
  };

  if (includeTotal) {
    const [rows, total] = await Promise.all([
      prisma.activityEntry.findMany({
        where,
        select,
        orderBy: { consumedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.activityEntry.count({ where }),
    ]);
    return {
      activities: rows,
      hasMore: offset + rows.length < total,
      total,
    };
  }

  const rows = await prisma.activityEntry.findMany({
    where,
    select,
    orderBy: { consumedAt: 'desc' },
    take: limit + 1,
    skip: offset,
  });

  const hasMore = rows.length > limit;
  const activities = hasMore ? rows.slice(0, limit) : rows;

  return { activities, hasMore, total: undefined };
};

/**
 * Creates a new learning activity entry for a specified user.
 *
 * @param userId - Unique identifier of the user creating the activity.
 * @param input - Activity creation details (source, title, url, type, tags, consumedAt).
 * @returns The newly created activity entry record.
 */
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

/**
 * Retrieves a single activity entry by ID for a specific user, including linked notes.
 *
 * @param id - Unique identifier of the activity entry.
 * @param userId - Unique identifier of the user who owns the activity.
 * @returns The activity entry record if found, or null if not found.
 */
export const getActivityByIdAndUser = async (id: string, userId: string) => {
  return prisma.activityEntry.findFirst({
    where: { id, userId },
    include: { notesLinked: true },
  });
};

/**
 * Updates an existing activity entry for a specific user.
 *
 * @param id - Unique identifier of the activity entry to update.
 * @param userId - Unique identifier of the user who owns the activity.
 * @param input - Partial update fields for the activity.
 * @returns The updated activity entry record, or null if the activity was not found.
 */
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

/**
 * Deletes an activity entry owned by a specific user.
 *
 * @param id - Unique identifier of the activity entry to delete.
 * @param userId - Unique identifier of the user who owns the activity.
 * @returns True if deletion succeeded, false if activity was not found.
 */
export const deleteActivityForUser = async (id: string, userId: string) => {
  const existing = await prisma.activityEntry.findFirst({ where: { id, userId } });
  if (!existing) return false;

  await prisma.activityEntry.delete({ where: { id } });
  return true;
};

