import type { Difficulty } from "@/types";

export const INTERVIEW_PROMPT_VERSION = "v1";

export interface InterviewEvalPromptInput {
  question: string;
  topic: string;
  difficulty: Difficulty;
  userAnswer: string;
}

export function getDefaultInterviewSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

const SYSTEM_PROMPT = `You are an expert technical interviewer evaluating a candidate's spoken answer to an interview question.
Assess the answer fairly and constructively, the way a senior engineer would in a real interview.

Return ONLY a valid JSON object with EXACTLY these keys:
- "score": A number from 0 to 10 rating the answer. Use this rubric:
  - 0-2: incorrect, irrelevant, or empty.
  - 3-4: partially correct but with major gaps or misconceptions.
  - 5-6: correct fundamentals but shallow or missing key details.
  - 7-8: solid, well-structured, mostly complete answer.
  - 9-10: excellent, precise, covers trade-offs and edge cases.
- "feedback": A concise paragraph (2-4 sentences) summarizing what was good and what was missing.
- "improvements": Array of strings, each a specific, actionable suggestion to make the answer stronger.
- "followUps": Array of 2-3 strings, natural follow-up questions an interviewer would ask next based on this answer.

Score strictly by the quality and correctness of the answer, not its length.
Do not include any keys other than those listed. Do not wrap the JSON in markdown fences.`;

export function buildInterviewEvalUserPrompt({
  question,
  topic,
  difficulty,
  userAnswer,
}: InterviewEvalPromptInput): string {
  return `Topic: ${topic}
Difficulty: ${difficulty}
Interview Question: ${question}

Candidate's Answer:
"""
${userAnswer}
"""

Evaluate this answer and return the JSON object now.`;
}

export function buildInterviewEvalPrompt(input: InterviewEvalPromptInput): {
  system: string;
  user: string;
} {
  return { system: SYSTEM_PROMPT, user: buildInterviewEvalUserPrompt(input) };
}
