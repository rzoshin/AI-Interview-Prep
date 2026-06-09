import { z } from "zod";

export const completeQuestionSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
});

export const recordQuizSchema = z.object({
  topicId: z.string().min(1, "topicId is required"),
  correct: z.coerce.number().int().min(0),
  total: z.coerce.number().int().min(1, "total must be at least 1"),
});

export type CompleteQuestionInput = z.infer<typeof completeQuestionSchema>;
export type RecordQuizInput = z.infer<typeof recordQuizSchema>;
