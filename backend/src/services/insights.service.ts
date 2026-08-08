/**
 * @file insights.service.ts
 * @description Service managing AI insight runs generation, retrieval, manual run creation, and user feedback processing.
 */

import { prisma } from '../config/prisma.js';
import { CreateInsightRunInput } from '../validators/insights.schema.js';
import { FeedbackInput } from '../validators/feedback.schema.js';
import { runAiInsightPipeline } from './ai/aiEngine.service.js';

/**
 * Retrieves a paginated list of insight runs generated for a specific user.
 *
 * @param userId - Unique identifier of the target user.
 * @param limit - Maximum number of insight runs to fetch (default: 20).
 * @param offset - Pagination offset (default: 0).
 * @returns Object containing the array of insight run records and total count.
 */
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

/**
 * Manually creates an insight run record for a user.
 *
 * @param userId - Unique identifier of the target user.
 * @param input - Insight run payload (input window, skill summary, direction summary, alignment score, citations).
 * @returns The newly created insight run record.
 */
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

/**
 * Retrieves a single insight run by ID for a specific user.
 *
 * @param id - Unique identifier of the insight run.
 * @param userId - Unique identifier of the user who owns the insight run.
 * @returns The insight run record if found, or null otherwise.
 */
export const getInsightRunByIdAndUser = async (id: string, userId: string) => {
  return prisma.insightRun.findFirst({
    where: { id, userId },
  });
};

/**
 * Triggers the AI Insight Engine Pipeline for a user, generates a new insight report,
 * and persists the result (or skipped state) to the database.
 *
 * @param userId - Unique identifier of the target user.
 * @param timeframeDays - Recency window in days for context aggregation (default: 30).
 * @returns Object containing `skipped` flag, persisted insight run record (`data`), and telemetry metadata.
 */
export const generateAndSaveInsightRun = async (userId: string, timeframeDays = 30) => {
  const pipelineResult = await runAiInsightPipeline(userId, timeframeDays);

  if ('skipped' in pipelineResult && pipelineResult.skipped) {
    const skippedRun = await prisma.insightRun.create({
      data: {
        userId,
        status: 'skipped',
        statusReason: pipelineResult.reason,
        alignmentScore: 'no_stated_goal',
        inputWindow: { timeframeDays },
        skillSummary: {},
        directionSummary: {},
        citations: [],
      },
    });

    return {
      skipped: true,
      reason: pipelineResult.reason,
      data: skippedRun,
    };
  }

  const result = pipelineResult as any;

  const savedRun = await prisma.insightRun.create({
    data: {
      userId,
      status: 'completed',
      tokensUsed: result.telemetry?.totalTokens || 0,
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
 * Processes user feedback on an existing insight run ('confirm' or 'correct').
 * If feedback action is 'correct', automatically updates the user's `skills_goals_profile`.
 *
 * @param userId - Unique identifier of the user submitting feedback.
 * @param insightId - Unique identifier of the insight run being reviewed.
 * @param feedback - Feedback payload containing action ('confirm' | 'correct') and corrected values.
 * @returns Confirmation object with processing timestamp, or null if insight run was not found.
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

