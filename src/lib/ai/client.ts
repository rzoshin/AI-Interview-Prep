import OpenAI from "openai";
import type { AIModel } from "@/types";

export interface AIClient {
  client: OpenAI;
  model: string;
  // Maps to the AIAnswer.generatedBy enum stored in MongoDB.
  provider: AIModel;
}

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

// Resolves an OpenAI-compatible client based on the configured provider.
// Groq is preferred (free tier, OpenAI-compatible); OpenAI is the fallback.
// Returns null when no provider is configured so callers can surface a clear error.
export function getAIClient(): AIClient | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      client: new OpenAI({ apiKey: groqKey, baseURL: GROQ_BASE_URL }),
      model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      provider: "groq",
    };
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      // Closest value in the stored enum for the OpenAI provider.
      provider: "gpt-5",
    };
  }

  return null;
}
