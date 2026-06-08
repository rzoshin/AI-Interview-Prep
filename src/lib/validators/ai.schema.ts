import { z } from "zod";

export const generateAnswerSchema = z.object({
  questionId: z.string().min(1),
  forceRegenerate: z.boolean().default(false),
});

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
