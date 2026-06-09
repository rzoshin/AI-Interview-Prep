import { auth } from "@/lib/auth";
import { questionRepository } from "@/repositories/question.repository";
import { pdfUploadRepository } from "@/repositories/pdf-upload.repository";
import { topicRepository } from "@/repositories/topic.repository";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const [totalQuestions, publishedQuestions, draftQuestions, pendingPdfUploads, totalTopics] =
      await Promise.all([
        questionRepository.count({}),
        questionRepository.count({ isPublished: true }),
        questionRepository.count({ isPublished: false }),
        pdfUploadRepository.count({ status: { $in: ["pending", "processing"] } }),
        topicRepository.count({}),
      ]);

    return successResponse({
      totalQuestions,
      publishedQuestions,
      draftQuestions,
      pendingPdfUploads,
      totalTopics,
    });
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return serverErrorResponse();
  }
}
