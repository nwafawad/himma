import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';

export const aiClient = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

/**
 * Structured Output JSON Schema for Gemini API responseSchema parameter
 */
export const insightResponseSchema = {
  type: 'OBJECT',
  properties: {
    skill_summary: {
      type: 'OBJECT',
      properties: {
        strong: { type: 'ARRAY', items: { type: 'STRING' } },
        emerging: { type: 'ARRAY', items: { type: 'STRING' } },
        developing: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['strong', 'emerging', 'developing'],
    },
    direction_summary: {
      type: 'OBJECT',
      properties: {
        narrative: { type: 'STRING' },
        candidatePaths: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              path: { type: 'STRING' },
              rationale: { type: 'STRING' },
            },
            required: ['path', 'rationale'],
          },
        },
      },
      required: ['narrative', 'candidatePaths'],
    },
    alignment_score: {
      type: 'STRING',
      enum: ['on track', 'drifting', 'no stated goal yet'],
    },
    citations: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
  },
  required: ['skill_summary', 'direction_summary', 'alignment_score', 'citations'],
};

export const generateGeminiContent = async (prompt: string, modelName: string) => {
  if (!aiClient) {
    throw new Error('GoogleGenAI client is not initialized (GEMINI_API_KEY missing).');
  }

  return aiClient.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: insightResponseSchema as any,
      temperature: 0.2,
    },
  });
};
