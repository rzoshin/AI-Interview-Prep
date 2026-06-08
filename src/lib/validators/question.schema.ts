import { z } from "zod";

export const createQuestionSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  question: z.string().min(10, "Question must be at least 10 characters"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string().toLowerCase().trim()).max(10),
  source: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const questionFiltersSchema = z.object({
  topic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionFilters = z.infer<typeof questionFiltersSchema>;
