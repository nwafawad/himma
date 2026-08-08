/**
 * @file aiEngine.service.ts
 * @description Core modular AI Insight Engine pipeline orchestrator.
 * Handles Context Building -> Usage Cap Enforcement -> Gemini LLM Invocation -> Citation Validation -> Auto-retry & Quota Fallbacks -> Telemetry.
 */

import { AlignmentScore } from '@prisma/client';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { buildUserContext } from './contextBuilder.js';
import { validateCitations } from './citationValidator.js';
import { generateLocalHeuristicInsight, GeneratedInsightPayload } from './heuristicEngine.js';
import { generateGeminiContent, aiClient } from './gemini.client.js';
import { createTelemetry, TelemetryData } from './telemetry.js';

export type { TelemetryData, GeneratedInsightPayload };

/**
 * Zod schema defining the expected structured JSON response format returned by the Gemini AI model.
 */
const aiOutputSchema = z.object({
  skill_summary: z.object({
    strong: z.array(z.string()).default([]),
    emerging: z.array(z.string()).default([]),
    developing: z.array(z.string()).default([]),
  }).default({ strong: [], emerging: [], developing: [] }),
  direction_summary: z.object({
    narrative: z.string().default(''),
    candidatePaths: z.array(z.object({
      path: z.string(),
      rationale: z.string(),
    })).default([]),
  }).default({ narrative: '', candidatePaths: [] }),
  alignment_score: z.enum(['on track', 'drifting', 'no stated goal yet']).default('no stated goal yet'),
  citations: z.array(z.string()).default([]),
});

/**
 * Modular AI Insight Engine Pipeline:
 * Orchestrates Context Building -> Cost/Budget Guardrails -> Gemini LLM Invocation -> Citation Validation -> Retries / Quota Fallback -> Telemetry.
 *
 * @param userId - Unique identifier of the user to generate learning insights for.
 * @param timeframeDays - Recency window in days for context aggregation (default: 30).
 * @returns The generated insight payload with telemetry, or a skip result object if thresholds/caps are met.
 */
export const runAiInsightPipeline = async (
  userId: string,
  timeframeDays = 30
): Promise<GeneratedInsightPayload | { skipped: true; reason: string }> => {
  const startTime = Date.now();

  const context = await buildUserContext(userId, timeframeDays);
  if (context.skipped) {
    return { skipped: true, reason: context.reason! };
  }

  // Cost & Budget Guardrail: Enforce monthly run limit per user
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const runsThisMonth = await prisma.insightRun.count({
    where: {
      userId,
      timestamp: { gte: startOfMonth },
      status: 'completed',
    },
  });

  if (runsThisMonth >= env.MAX_MONTHLY_INSIGHT_RUNS_PER_USER) {
    return {
      skipped: true,
      reason: `MONTHLY_USAGE_CAP_EXCEEDED: Maximum monthly Insight Runs limit reached (${runsThisMonth}/${env.MAX_MONTHLY_INSIGHT_RUNS_PER_USER}).`,
    };
  }

  const { profile, activities, notes, digest, validUuids } = context;

  // Fallback if no live Gemini API key is configured
  if (!aiClient || !env.GEMINI_API_KEY) {
    console.log('💡 Running AI Engine with local dev fallback heuristic (GEMINI_API_KEY not configured).');
    return generateLocalHeuristicInsight(activities, notes, profile, timeframeDays);
  }

  const modelName = env.GEMINI_MODEL || 'gemini-2.0-flash';

  const digestPrompt = digest
    ? `\nHISTORICAL PROFILE DIGEST (older than 30 days):\n${JSON.stringify(digest)}\n`
    : '';

  const systemPrompt = `You are a Principal AI Learning Analyst for Momentum.
Analyze the user's recent learning activities, notes, and skills profile to produce a structured JSON report.

CRITICAL CITATION RULE:
Every ID in the "citations" array MUST match an exact "id" from the provided Notes or Activities lists.
Do NOT invent fake UUIDs.

AVAILABLE USER LOGS:
Profile Target Path: ${profile?.targetPath || 'None specified'}
Profile Current Skills: ${JSON.stringify(profile?.currentSkills || [])}
${digestPrompt}
ACTIVITIES (${activities.length} entries):
${activities.map((a) => `- ID: ${a.id} | Title: "${a.title}" | Type: ${a.type} | Tags: [${a.tags.join(', ')}]`).join('\n')}

NOTES (${notes.length} entries):
${notes.map((n) => `- ID: ${n.id} | Text: "${n.text.substring(0, 100)}" | Tags: [${n.tags.join(', ')}]`).join('\n')}
`;

  let attempts = 0;
  const maxRetries = 2;
  let retryInstruction = '';

  while (attempts <= maxRetries) {
    attempts++;
    const currentPrompt = systemPrompt + (retryInstruction ? `\n\nRETRY CORRECTION:\n${retryInstruction}` : '');

    try {
      const response = await generateGeminiContent(currentPrompt, modelName);
      const responseText = response.text || '{}';
      
      // Sanitize markdown fences from raw text
      const sanitizedText = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const rawJson = JSON.parse(sanitizedText);
      const parsedJson = aiOutputSchema.parse(rawJson);

      // Validate citations against database valid UUIDs
      const citationCheck = validateCitations(parsedJson.citations, validUuids);

      if (!citationCheck.isValid) {
        console.warn(`Attempt ${attempts} failed citation validation. Invalid IDs: ${citationCheck.invalidIds.join(', ')}`);
        retryInstruction = `Your previous citations contained invalid IDs (${citationCheck.invalidIds.join(', ')}). Only use valid IDs from the provided ACTIVITIES and NOTES lists!`;
        if (attempts <= maxRetries) continue;
      }

      // Format alignment score to Prisma enum
      let alignmentScore: AlignmentScore = AlignmentScore.no_stated_goal;
      const rawScore = parsedJson.alignment_score;
      if (rawScore === 'on track') alignmentScore = AlignmentScore.on_track;
      if (rawScore === 'drifting') alignmentScore = AlignmentScore.drifting;
      if (rawScore === 'no stated goal yet') alignmentScore = AlignmentScore.no_stated_goal;

      const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
      const telemetry = createTelemetry(
        startTime,
        tokensUsed,
        attempts > 1 ? 'RETRY_SUCCESS' : 'SUCCESS',
        attempts - 1,
        modelName
      );

      return {
        inputWindow: {
          timeframeDays,
          activitiesCount: activities.length,
          notesCount: notes.length,
        },
        skillSummary: {
          strong: parsedJson.skill_summary.strong,
          emerging: parsedJson.skill_summary.emerging,
          developing: parsedJson.skill_summary.developing,
        },
        directionSummary: {
          narrative: parsedJson.direction_summary.narrative,
          candidatePaths: parsedJson.direction_summary.candidatePaths,
        },
        alignmentScore,
        citations: parsedJson.citations,
        telemetry,
      };
    } catch (err: any) {
      console.error(`AI Pipeline Attempt ${attempts} error:`, err.message);

      // Handle Quota Limit (HTTP 429) gracefully with fallback
      if (err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))) {
        console.warn('⚠️ Gemini API rate limit / quota hit. Using fallback heuristic generator.');
        return generateLocalHeuristicInsight(activities, notes, profile, timeframeDays);
      }

      retryInstruction = `The output failed JSON formatting. Provide strictly valid JSON according to schema.`;
      if (attempts > maxRetries) {
        console.warn('⚠️ AI Pipeline max retries reached. Falling back to heuristic generator.');
        return generateLocalHeuristicInsight(activities, notes, profile, timeframeDays);
      }
    }
  }

  return generateLocalHeuristicInsight(activities, notes, profile, timeframeDays);
};

