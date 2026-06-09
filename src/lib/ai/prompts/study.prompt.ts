import type { Difficulty } from "@/types";

export const STUDY_PROMPT_VERSION = "v1";

export interface StudyEvalPromptInput {
  question: string;
  topic: string;
  difficulty: Difficulty;
  userAnswer: string;
}

export function getDefaultStudySystemPrompt(): string {
  return SYSTEM_PROMPT;
}

const SYSTEM_PROMPT = `You are an expert technical interviewer evaluating a student's written answer to a study question.
Assess correctness fairly and give constructive feedback.

Return ONLY a valid JSON object with EXACTLY these keys:
- "verdict": One of "correct", "partial", or "incorrect".
  - "correct": fundamentally right, covers the core idea well.
  - "partial": some correct ideas but missing key details or has misconceptions.
  - "incorrect": wrong, irrelevant, or too vague to demonstrate understanding.
- "score": A number from 0 to 10 (same rubric as interview scoring).
- "feedback": A concise paragraph (2-4 sentences) explaining the verdict.
- "improvements": Array of strings, each a specific suggestion to improve the answer.

Do not include any keys other than those listed. Do not wrap the JSON in markdown fences.`;

export function buildStudyEvalUserPrompt({
  question,
  topic,
  difficulty,
  userAnswer,
}: StudyEvalPromptInput): string {
  return `Topic: ${topic}
Difficulty: ${difficulty}
Question: ${question}

Student's Answer:
"""
${userAnswer}
"""

Evaluate this answer and return the JSON object now.`;
}
