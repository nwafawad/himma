import { prisma } from '../config/prisma.js';
import { CreateInsightRunInput } from '../validators/insights.schema.js';

export const listInsightRuns = async (userId: string, limit = 20, offset = 0) => {
  const [insights, total] = await Promise.all([
    prisma.insightRun.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.insightRun.count({ where: { userId } }),
  ]);
  return { insights, total };
};

export const createInsightRunForUser = async (userId: string, input: CreateInsightRunInput) => {
  const { inputWindow, skillSummary, directionSummary, alignmentScore, citations } = input;
  return prisma.insightRun.create({
    data: {
      userId,
      inputWindow: inputWindow || {},
      skillSummary,
      directionSummary,
      alignmentScore,
      citations: citations || [],
    },
  });
};

export const getInsightRunByIdAndUser = async (id: string, userId: string) => {
  return prisma.insightRun.findFirst({
    where: { id, userId },
  });
};
