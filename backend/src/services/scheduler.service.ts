/**
 * @file scheduler.service.ts
 * @description Background cron scheduler service executing automated batch AI insight runs for active users.
 */

import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { generateAndSaveInsightRun } from './insights.service.js';
import { withTryAdvisoryLock } from '../db/advisoryLock.js';

/**
 * Executes batch AI Insight Run generation for a single user with exponential backoff retries.
 * In case of persistent failures after maximum retries, records a `failed` status insight run.
 *
 * @param userId - Unique identifier of the user to process.
 * @param timeframeDays - Recency window in days for context gathering (default: 30).
 * @param maxRetries - Maximum retry attempts upon error (default: 2).
 * @returns Resolves when user insight generation completes or failure is recorded.
 */
export const executeUserInsightWithRetry = async (
  userId: string,
  timeframeDays = 30,
  maxRetries = 2
): Promise<void> => {
  let attempt = 0;
  let delayMs = 1000;

  while (attempt <= maxRetries) {
    try {
      attempt++;
      await generateAndSaveInsightRun(userId, timeframeDays);
      return; // Success
    } catch (error: any) {
      console.error(`⚠️ Batch insight attempt ${attempt} failed for user ${userId}:`, error.message);
      if (attempt > maxRetries) {
        // Record batch failure state for user in insight_runs without mutating user notes/activities
        try {
          await prisma.insightRun.create({
            data: {
              userId,
              status: 'failed',
              statusReason: error.message || 'Batch execution failed after retries',
              alignmentScore: 'no_stated_goal',
              inputWindow: { timeframeDays },
              skillSummary: {},
              directionSummary: {},
              citations: [],
            },
          });
        } catch (dbErr: any) {
          console.error(`❌ Failed to record failure state for user ${userId}:`, dbErr.message);
        }
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
};

/**
 * Batch processor: Identifies all active users with activity entries or notes in the past 30 days
 * and triggers AI Insight Runs in concurrent chunks of 5 users.
 *
 * @returns Summary object containing counts of successfully processed users and errors encountered.
 */
const executeBatchInsightEngine = async (): Promise<{ processed: number; errors: number }> => {
  console.log('🚀 Starting Scheduled Batch AI Insight Engine Job...');
  let processed = 0;
  let errors = 0;

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Only process users with log activity or notes in the past 30 days
    const activeUsers = await prisma.user.findMany({
      where: {
        OR: [
          { activityEntries: { some: { consumedAt: { gte: thirtyDaysAgo } } } },
          { noteEntries: { some: { createdAt: { gte: thirtyDaysAgo } } } },
        ],
      },
      select: { id: true },
    });

    console.log(`📋 Found ${activeUsers.length} active user(s) for batch insight processing.`);

    const chunkSize = 5;
    for (let i = 0; i < activeUsers.length; i += chunkSize) {
      const chunk = activeUsers.slice(i, i + chunkSize);
      const results = await Promise.allSettled(
        chunk.map((user) => executeUserInsightWithRetry(user.id))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          processed++;
        } else {
          errors++;
          console.error('Batch processing chunk item failed:', result.reason);
        }
      }
    }
  } catch (err: any) {
    console.error('❌ Critical failure during batch job execution:', err.message);
  }

  console.log(`✅ Batch AI Insight Engine Job completed. Processed: ${processed}, Errors: ${errors}`);
  return { processed, errors };
};

export const runBatchInsightEngine = async (): Promise<{ processed: number; errors: number }> => {
  const result = await withTryAdvisoryLock('scheduler:batch-insights', executeBatchInsightEngine);
  if (result) return result;
  console.log('Another replica owns the scheduled insight job; skipping this run.');
  return { processed: 0, errors: 0 };
};

/**
 * Initializes and starts the background cron scheduler daemon using configured cron pattern.
 *
 * @returns The scheduled node-cron task instance.
 */
export const initScheduler = (): ScheduledTask => {
  const cronExpr = env.INSIGHT_BATCH_CRON;
  console.log(`⏰ Initializing Insight Engine Cron Scheduler with pattern: "${cronExpr}"`);

  return cron.schedule(cronExpr, () => {
    // Non-blocking async launch
    runBatchInsightEngine().catch((err) => {
      console.error('Unhandled exception in cron job wrapper:', err);
    });
  });
};
