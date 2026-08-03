import { AlignmentScore } from '@prisma/client';
import { TelemetryData } from './telemetry.js';

export interface GeneratedInsightPayload {
  inputWindow: Record<string, any>;
  skillSummary: {
    strong: string[];
    emerging: string[];
    developing: string[];
  };
  directionSummary: {
    narrative: string;
    candidatePaths: Array<{ path: string; rationale: string }>;
  };
  alignmentScore: AlignmentScore;
  citations: string[];
  telemetry: TelemetryData;
}

/**
 * Heuristic generator for local development mode or quota fallback.
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
      developing: developing.length > 0 ? developing : ['Supabase Auth'],
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
