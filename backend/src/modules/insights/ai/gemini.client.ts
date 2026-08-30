/**
 * @file gemini.client.ts
 * @description Google GenAI client instance setup, response JSON schema definitions, and LLM generation wrapper.
 */

import { GoogleGenAI } from '@google/genai';
import { env } from '../../../config/env.js';

/**
 * Singleton instance of GoogleGenAI client initialized with GEMINI_API_KEY environment variable.
 * Null if no API key is provided in environment variables.
 */
export const aiClient = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

/**
 * Structured Output JSON Schema definition passed into Gemini API `responseSchema` parameter
 * to enforce exact response structure matching application domain models.
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

/**
 * Invokes the Gemini API model with JSON schema enforcement and standard generation parameters.
 *
 * @param prompt - Prompt string containing instructions, schema context, and user logs.
 * @param modelName - Target Gemini model name string (e.g., 'gemini-2.0-flash').
 * @returns Promise resolving to the model output response.
 * @throws Error if `aiClient` is null (missing API key).
 */
export const generateGeminiContent = async (prompt: string, modelName: string) => {
  if (!aiClient) {
    throw new Error('GoogleGenAI client is not initialized (GEMINI_API_KEY missing).');
  }

  return aiClient.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: insightResponseSchema,
      temperature: 0.2,
    },
  });
};
