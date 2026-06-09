export const QUIZ_QUESTION_COUNT = 15;

export interface TopicQuizPromptInput {
  topicName: string;
  sampleQuestions: string[];
}

export function getDefaultQuizSystemPrompt(): string {
  return QUIZ_SYSTEM_PROMPT;
}

const QUIZ_SYSTEM_PROMPT = `You are an expert technical interviewer creating a multiple-choice quiz.
Generate exactly ${QUIZ_QUESTION_COUNT} high-quality multiple-choice questions to test someone's knowledge of the given topic.

Return ONLY a valid JSON object of this exact shape:
{ "quiz": [ { "question": string, "options": string[] (exactly 4), "correctIndex": number (0-3), "explanation": string } ] }

Rules:
- Questions must be specifically about the given topic and progressively cover fundamentals to advanced concepts.
- Exactly 4 options per question, with exactly one correct answer.
- "correctIndex" is the 0-based index of the correct option.
- Keep each question self-contained and unambiguous.
- Do not wrap the JSON in markdown fences.`;

export function buildTopicQuizUserPrompt({ topicName, sampleQuestions }: TopicQuizPromptInput): string {
  const grounding =
    sampleQuestions.length > 0
      ? `\n\nFor context, here are some interview questions from this topic (use them as inspiration, do not copy verbatim):\n${sampleQuestions
          .slice(0, 12)
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      : "";

  return `Topic: ${topicName}

Generate the ${QUIZ_QUESTION_COUNT}-question JSON quiz for this topic now.${grounding}`;
}

export function buildTopicQuizPrompt({ topicName, sampleQuestions }: TopicQuizPromptInput): {
  system: string;
  user: string;
} {
  const system = QUIZ_SYSTEM_PROMPT;
  return { system, user: buildTopicQuizUserPrompt({ topicName, sampleQuestions }) };
}
