import { prisma } from '../config/prisma.js';
import { UpsertProfileInput } from '../validators/profile.schema.js';

export const getProfileByUserId = async (userId: string) => {
  return prisma.skillsGoalsProfile.findUnique({
    where: { userId },
  });
};

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
