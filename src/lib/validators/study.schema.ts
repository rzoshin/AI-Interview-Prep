import { z } from "zod";

export const saveStudyNoteSchema = z.object({
  content: z.string().max(10000),
});

export const evaluateStudyAnswerSchema = z.object({
  answer: z.string().min(1, "Answer is required").max(10000),
});

export type SaveStudyNoteInput = z.infer<typeof saveStudyNoteSchema>;
export type EvaluateStudyAnswerInput = z.infer<typeof evaluateStudyAnswerSchema>;
