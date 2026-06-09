import { z } from "zod";

export const promptNameSchema = z.enum(["answer", "quiz", "interview", "roadmap"]);

export const createPromptSchema = z.object({
  name: promptNameSchema,
  content: z.string().min(20, "Prompt content must be at least 20 characters"),
  aiModel: z.enum(["gpt-5", "claude", "gemini"]),
  version: z.string().min(1).optional(),
  isActive: z.boolean().default(true),
});

export const updatePromptSchema = z.object({
  content: z.string().min(20).optional(),
  aiModel: z.enum(["gpt-5", "claude", "gemini"]).optional(),
  version: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
