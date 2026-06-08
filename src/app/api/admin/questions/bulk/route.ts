import { z } from "zod";
import { auth } from "@/lib/auth";
import { pdfService, type ExtractedQuestion } from "@/services/pdf.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

const bulkImportSchema = z.object({
  uploadId: z.string().min(1),
  questions: z.array(
    z.object({
      question: z.string().min(10),
      topic: z.string().min(1),
      difficulty: z.enum(["easy", "medium", "hard"]),
      tags: z.array(z.string()).default([]),
      source: z.string().optional(),
      isDuplicate: z.boolean().optional(),
      duplicateOf: z.string().optional(),
      duplicateSimilarity: z.number().optional(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const body = await req.json();
    const parsed = bulkImportSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { uploadId, questions } = parsed.data;

    const result = await pdfService.bulkImport(
      uploadId,
      questions as ExtractedQuestion[]
    );

    return successResponse(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    console.error("[POST /api/admin/questions/bulk]", error);
    return errorResponse(message, 400);
  }
}
