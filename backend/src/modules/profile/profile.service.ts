/**
 * @file profile.service.ts
 * @description Service managing user skills and goals profiles (SkillsGoalsProfile).
 */

import type { UpsertProfileInput } from '@himma/contracts';
import { prisma } from '../../config/prisma.js';

/**
 * Retrieves the skills and goals profile for a given user ID.
 *
 * @param userId - Unique identifier of the user.
 * @returns The user's SkillsGoalsProfile record, or null if no profile exists.
 */
export const getProfileByUserId = async (userId: string) => {
  return prisma.skillsGoalsProfile.findUnique({
    where: { userId },
  });
};

/**
 * Creates or updates (upserts) the skills and goals profile for a given user ID.
 *
 * @param userId - Unique identifier of the user.
 * @param input - Profile details (currentSkills, interests, targetPath, avatarUrl).
 * @returns The created or updated SkillsGoalsProfile record.
 */
export const upsertProfileByUserId = async (userId: string, input: UpsertProfileInput) => {
  const { currentSkills, interests, targetPath, avatarUrl } = input;
  return prisma.skillsGoalsProfile.upsert({
    where: { userId },
    create: {
      userId,
      avatarUrl: avatarUrl || null,
      currentSkills: currentSkills || [],
      interests: interests || [],
      targetPath: targetPath || null,
    },
    update: {
      avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      currentSkills: currentSkills || [],
      interests: interests || [],
      targetPath: targetPath || null,
    },
  });
};
