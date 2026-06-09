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

// Shape of the per-answer evaluation returned by the LLM. Every field has a
// default so a partial model response still parses into a complete record.
export const interviewEvaluationSchema = z.object({
  score: z.coerce.number().min(0).max(10).catch(0).default(0),
  feedback: z.string().catch("").default(""),
  improvements: z.array(z.string()).catch([]).default([]),
  followUps: z.array(z.string()).catch([]).default([]),
});

export type InterviewEvaluation = z.infer<typeof interviewEvaluationSchema>;

export const studyEvaluationSchema = z.object({
  verdict: z
    .enum(["correct", "partial", "incorrect"])
    .catch("partial")
    .default("partial"),
  score: z.coerce.number().min(0).max(10).catch(0).default(0),
  feedback: z.string().catch("").default(""),
  improvements: z.array(z.string()).catch([]).default([]),
});

export type StudyEvaluation = z.infer<typeof studyEvaluationSchema>;

// Shape of the AI-generated learning roadmap (json_object mode). Resilient
// defaults so a partial model response still parses.
export const roadmapMilestoneSchema = z.object({
  topicSlug: z.string().catch("").default(""),
  title: z.string().catch("").default(""),
  description: z.string().catch("").default(""),
});

export const roadmapSchema = z.object({
  level: z
    .enum(["beginner", "intermediate", "advanced", "interview-ready"])
    .catch("beginner")
    .default("beginner"),
  summary: z.string().catch("").default(""),
  milestones: z.array(roadmapMilestoneSchema).catch([]).default([]),
});

export type GeneratedRoadmap = z.infer<typeof roadmapSchema>;

// Supported OpenAI neural TTS voices.
export const OPENAI_TTS_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
] as const;

export const ttsRequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(4096),
  voice: z.enum(OPENAI_TTS_VOICES).default("nova"),
});

export type TtsRequestInput = z.infer<typeof ttsRequestSchema>;

export type GenerateAnswerInput = z.infer<typeof generateAnswerSchema>;
export type InterviewAnswerInput = z.infer<typeof interviewAnswerSchema>;
export type StartInterviewInput = z.infer<typeof startInterviewSchema>;
