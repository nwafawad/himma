import { AlignmentScore } from '@prisma/client';
import { env } from '../../config/env.js';
import { buildUserContext } from './contextBuilder.js';
import { validateCitations } from './citationValidator.js';
import { generateLocalHeuristicInsight, GeneratedInsightPayload } from './heuristicEngine.js';
import { generateGeminiContent, aiClient } from './gemini.client.js';
import { createTelemetry, TelemetryData } from './telemetry.js';

export { TelemetryData, GeneratedInsightPayload };

/**
 * Modular AI Insight Engine Pipeline:
 * Orchestrates Context Building -> Gemini LLM Invocation -> Citation Validation -> Retries / Quota Fallback -> Telemetry.
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

  const { profile, activities, notes, validUuids } = context;

  // Fallback if no live Gemini API key is configured
  if (!aiClient || !env.GEMINI_API_KEY) {
    console.log('💡 Running AI Engine with local dev fallback heuristic (GEMINI_API_KEY not configured).');
    return generateLocalHeuristicInsight(activities, notes, profile, timeframeDays);
  }

  const modelName = env.GEMINI_MODEL || 'gemini-2.0-flash';

  const systemPrompt = `You are a Principal AI Learning Analyst for Momentum.
Analyze the user's recent learning activities, notes, and skills profile to produce a structured JSON report.

CRITICAL CITATION RULE:
Every ID in the "citations" array MUST match an exact "id" from the provided Notes or Activities lists.
Do NOT invent fake UUIDs.

AVAILABLE USER LOGS:
Profile Target Path: ${profile?.targetPath || 'None specified'}
Profile Current Skills: ${JSON.stringify(profile?.currentSkills || [])}

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
      const parsedJson = JSON.parse(responseText);

      // Validate citations against database valid UUIDs
      const citationCheck = validateCitations(parsedJson.citations || [], validUuids);

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
          strong: parsedJson.skill_summary?.strong || [],
          emerging: parsedJson.skill_summary?.emerging || [],
          developing: parsedJson.skill_summary?.developing || [],
        },
        directionSummary: {
          narrative: parsedJson.direction_summary?.narrative || '',
          candidatePaths: parsedJson.direction_summary?.candidatePaths || [],
        },
        alignmentScore,
        citations: parsedJson.citations || [],
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
