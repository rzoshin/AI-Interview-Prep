import { z } from "zod";

export const generateAnswerSchema = z.object({
  questionId: z.string().min(1),
  forceRegenerate: z.boolean().default(false),
});

// Shape of the structured answer object returned by the LLM. Every field has a
// default so a partial model response still parses into a complete record.
export const quizQuestionSchema = z.object({
  question: z.string().default(""),
  options: z.array(z.string()).default([]),
  correctIndex: z.coerce.number().int().min(0).default(0),
  explanation: z.string().default(""),
});

export const generatedAnswerSchema = z.object({
  bangla_eli5: z.string().catch("").default(""),
  english_eli5: z.string().catch("").default(""),
  beginner_answer: z.string().catch("").default(""),
  interview_answer: z.string().catch("").default(""),
  senior_answer: z.string().catch("").default(""),
  code_example: z.string().catch("").default(""),
  common_mistakes: z.array(z.string()).catch([]).default([]),
  follow_up_questions: z.array(z.string()).catch([]).default([]),
  related_topics: z.array(z.string()).catch([]).default([]),
  quiz_questions: z.array(quizQuestionSchema).catch([]).default([]),
});

export type GeneratedAnswer = z.infer<typeof generatedAnswerSchema>;

// Shape of the AI-generated topic quiz (wrapped in an object for json_object mode).
export const topicQuizSchema = z.object({
  quiz: z.array(quizQuestionSchema).catch([]).default([]),
});

export type TopicQuiz = z.infer<typeof topicQuizSchema>;

export const interviewAnswerSchema = z.object({
  answer: z.string().min(1, "Answer is required").max(5000),
  questionId: z.string().min(1),
});

export const startInterviewSchema = z.object({
  topicId: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  questionCount: z.number().int().min(1).max(20).default(5),
});

export type GenerateAnswerInput = z.infer<typeof generateAnswerSchema>;
export type InterviewAnswerInput = z.infer<typeof interviewAnswerSchema>;
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
