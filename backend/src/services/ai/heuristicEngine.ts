/**
 * @file heuristicEngine.ts
 * @description Local rule-based fallback heuristic engine for offline dev mode or API quota limit fallback.
 */

import { AlignmentScore } from '@prisma/client';
import { TelemetryData } from './telemetry.js';

/**
 * Interface representing the complete output payload of generated insights.
 */
export interface GeneratedInsightPayload {
  /** Summary of input window parameters and entity counts */
  inputWindow: Record<string, any>;
  /** Categorized skills breakdown */
  skillSummary: {
    strong: string[];
    emerging: string[];
    developing: string[];
  };
  /** Direction narrative and recommended candidate learning paths */
  directionSummary: {
    narrative: string;
    candidatePaths: Array<{ path: string; rationale: string }>;
  };
  /** Calculated alignment score Prisma enum value */
  alignmentScore: AlignmentScore;
  /** Array of activity/note entry UUID citations backing the insight */
  citations: string[];
  /** Execution telemetry data */
  telemetry: TelemetryData;
}

/**
 * Generates an insight payload using deterministic tag frequency heuristics and profile matching rules.
 * Used during local development when no Gemini API key is configured or as a fallback when rate/quota limits occur.
 *
 * @param activities - Array of user activity entries.
 * @param notes - Array of user note entries.
 * @param profile - User's skills and goals profile record.
 * @param timeframeDays - Recency window in days.
 * @returns Complete GeneratedInsightPayload object marked with `DEV_FALLBACK` telemetry status.
 */
export const generateLocalHeuristicInsight = (
  activities: any[],
  notes: any[],
  profile: any,
  timeframeDays: number
): GeneratedInsightPayload => {
  const allTags = [
    ...(profile?.currentSkills || []),
    ...activities.flatMap((a) => a.tags),
    ...notes.flatMap((n) => n.tags),
  ];

  const uniqueSkills = Array.from(new Set(allTags)).slice(0, 10);
  const strong = uniqueSkills.slice(0, 3);
  const emerging = uniqueSkills.slice(3, 6);
  const developing = uniqueSkills.slice(6, 10);

  const sampleCitations = [
    ...activities.slice(0, 2).map((a) => a.id),
    ...notes.slice(0, 2).map((n) => n.id),
  ];

  let alignmentScore: AlignmentScore = AlignmentScore.no_stated_goal;
  if (profile?.targetPath) {
    alignmentScore = activities.length > 2 ? AlignmentScore.on_track : AlignmentScore.drifting;
  }

  return {
    inputWindow: {
      timeframeDays,
      activitiesCount: activities.length,
      notesCount: notes.length,
    },
    skillSummary: {
      strong: strong.length > 0 ? strong : ['TypeScript', 'Node.js'],
      emerging: emerging.length > 0 ? emerging : ['PostgreSQL', 'Prisma'],
      developing: developing.length > 0 ? developing : ['Authentication & Security'],
    },
    directionSummary: {
      narrative: `User has recorded ${activities.length} activity entries and ${notes.length} notes in the past ${timeframeDays} days. Focus is aligned with target path: ${profile?.targetPath || 'Not set'}.`,
      candidatePaths: [
        {
          path: profile?.targetPath || 'Backend & Cloud Infrastructure Engineer',
          rationale: 'Consistent learning entries covering REST APIs, database schemas, and cloud deployment.',
        },
      ],
    },
    alignmentScore,
    citations: sampleCitations,
    telemetry: {
      durationMs: 42,
      tokensUsed: 0,
      status: 'DEV_FALLBACK',
      retryCount: 0,
      modelUsed: 'local-heuristic-engine',
    },
  };
};

