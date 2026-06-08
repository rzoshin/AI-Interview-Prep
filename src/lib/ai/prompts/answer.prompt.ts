import type { Difficulty } from "@/types";

export const ANSWER_PROMPT_VERSION = "v1";

export interface AnswerPromptInput {
  question: string;
  topic: string;
  difficulty: Difficulty;
}

const SYSTEM_PROMPT = `You are an expert technical interviewer and educator.
For a given interview question, produce a single comprehensive study record as a JSON object.

Return ONLY a valid JSON object with EXACTLY these keys:
- "bangla_eli5": A simple, beginner-friendly explanation in Bengali (Bangla script), as if explaining to a 5-year-old.
- "english_eli5": A simple, beginner-friendly explanation in English, as if explaining to a 5-year-old.
- "beginner_answer": A clear, correct answer aimed at a junior developer.
- "interview_answer": A concise, well-structured answer suitable to say out loud in an interview.
- "senior_answer": An in-depth answer covering trade-offs, edge cases, and best practices that a senior engineer would give.
- "code_example": A relevant code snippet as a string (use a fenced code block with a language tag). Empty string if not applicable.
- "common_mistakes": Array of strings, each a common mistake or misconception.
- "follow_up_questions": Array of strings, likely follow-up interview questions.
- "related_topics": Array of strings, related topic names.
- "quiz_questions": Array of 3-5 objects, each { "question": string, "options": string[] (4 options), "correctIndex": number (0-based), "explanation": string }.

Do not include any keys other than those listed. Do not wrap the JSON in markdown fences.`;

export function buildAnswerPrompt({ question, topic, difficulty }: AnswerPromptInput): {
  system: string;
  user: string;
} {
  const user = `Topic: ${topic}
Difficulty: ${difficulty}
Question: ${question}

Generate the JSON study record for this question now.`;

  return { system: SYSTEM_PROMPT, user };
}
