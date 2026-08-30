import { z } from 'zod';
import { paginatedResponseSchema, uuidSchema } from './common.js';

export const alignmentScoreSchema = z.enum(['on_track', 'drifting', 'no_stated_goal']);

export const skillSummarySchema = z.object({
  strong: z.array(z.string()).optional().default([]),
  emerging: z.array(z.string()).optional().default([]),
  developing: z.array(z.string()).optional().default([]),
});

export const candidatePathSchema = z.object({
  path: z.string(),
  rationale: z.string(),
});

export const directionSummarySchema = z.object({
  narrative: z.string().optional().default(''),
  candidatePaths: z.array(candidatePathSchema).optional().default([]),
});

export const insightInputWindowSchema = z.object({
  timeframeDays: z.number().optional(),
  activitiesCount: z.number().optional(),
  notesCount: z.number().optional(),
}).passthrough();

export const insightSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema.optional(),
  timestamp: z.string().datetime(),
  inputWindow: insightInputWindowSchema.optional().default({}),
  skillSummary: skillSummarySchema.optional().default({}),
  directionSummary: directionSummarySchema.optional().default({}),
  alignmentScore: alignmentScoreSchema,
  citations: z.array(z.string()).optional().default([]),
  status: z.enum(['completed', 'skipped']),
  statusReason: z.string().nullable().optional(),
  tokensUsed: z.number().int().nonnegative().optional().default(0),
});

export const createInsightRunInputSchema = z.object({
  inputWindow: z.record(z.any()).optional().default({}),
  skillSummary: z.record(z.any()),
  directionSummary: z.record(z.any()),
  alignmentScore: alignmentScoreSchema,
  citations: z.union([z.array(z.string()), z.record(z.any())]).optional().default([]),
});

export const feedbackInputSchema = z.object({
  action: z.enum(['confirm', 'correct']),
  correctedSkills: z.array(z.string()).optional(),
  correctedTargetPath: z.string().optional().nullable(),
});

export const insightsResponseSchema = paginatedResponseSchema(insightSchema);

export const generateInsightResponseSchema = z.union([
  z.object({
    skipped: z.literal(true),
    message: z.string().optional(),
    reason: z.string().optional(),
  }),
  z.object({
    skipped: z.literal(false).optional(),
    data: insightSchema,
    telemetry: z.record(z.unknown()).optional(),
  }),
]);

export type AlignmentScore = z.infer<typeof alignmentScoreSchema>;
export type SkillSummary = z.infer<typeof skillSummarySchema>;
export type CandidatePath = z.infer<typeof candidatePathSchema>;
export type DirectionSummary = z.infer<typeof directionSummarySchema>;
export type InsightInputWindow = z.infer<typeof insightInputWindowSchema>;
export type Insight = z.infer<typeof insightSchema>;
export type CreateInsightRunInput = z.infer<typeof createInsightRunInputSchema>;
export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
export type InsightsResponse = z.infer<typeof insightsResponseSchema>;
export type GenerateInsightResponse = z.infer<typeof generateInsightResponseSchema>;
