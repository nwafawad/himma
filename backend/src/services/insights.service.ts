import { prisma } from '../config/prisma.js';
import { CreateInsightRunInput } from '../validators/insights.schema.js';
import { FeedbackInput } from '../validators/feedback.schema.js';
import { runAiInsightPipeline } from './ai/aiEngine.service.js';

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

/**
 * Trigger AI Insight Engine Pipeline, generate report, and save to insight_runs table.
 */
export const generateAndSaveInsightRun = async (userId: string, timeframeDays = 30) => {
  const pipelineResult = await runAiInsightPipeline(userId, timeframeDays);

  if ('skipped' in pipelineResult && pipelineResult.skipped) {
    return {
      skipped: true,
      reason: pipelineResult.reason,
    };
  }

  const result = pipelineResult as any;

  const savedRun = await prisma.insightRun.create({
    data: {
      userId,
      inputWindow: result.inputWindow,
      skillSummary: result.skillSummary,
      directionSummary: result.directionSummary,
      alignmentScore: result.alignmentScore,
      citations: result.citations,
    },
  });

  return {
    skipped: false,
    data: savedRun,
    telemetry: result.telemetry,
  };
};

/**
 * Handle user feedback on an insight run ('confirm' or 'correct').
 * If 'correct', update user's skills_goals_profile.
 */
export const processInsightFeedback = async (
  userId: string,
  insightId: string,
  feedback: FeedbackInput
) => {
  const insight = await prisma.insightRun.findFirst({
    where: { id: insightId, userId },
  });

  if (!insight) {
    return null;
  }

  if (feedback.action === 'correct') {
    const existingProfile = await prisma.skillsGoalsProfile.findUnique({
      where: { userId },
    });

    const updatedSkills = feedback.correctedSkills
      ? feedback.correctedSkills
      : existingProfile?.currentSkills || [];

    const updatedTargetPath = feedback.correctedTargetPath !== undefined
      ? feedback.correctedTargetPath
      : existingProfile?.targetPath;

    await prisma.skillsGoalsProfile.upsert({
      where: { userId },
      create: {
        userId,
        currentSkills: updatedSkills,
        interests: existingProfile?.interests || [],
        targetPath: updatedTargetPath || null,
      },
      update: {
        currentSkills: updatedSkills,
        targetPath: updatedTargetPath !== undefined ? updatedTargetPath : existingProfile?.targetPath,
      },
    });
  }

  return {
    insightId,
    action: feedback.action,
    processedAt: new Date().toISOString(),
  };
};
