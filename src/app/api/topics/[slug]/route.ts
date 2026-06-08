import { topicRepository } from "@/repositories/topic.repository";
import { questionRepository } from "@/repositories/question.repository";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/utils/api-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const topic = await topicRepository.findBySlug(slug);
    if (!topic) return notFoundResponse("Topic");

    const questionCount = await questionRepository.count({
      topic: topic._id,
      isPublished: true,
    });

    return successResponse({ ...topic, questionCount });
  } catch (error) {
    console.error("[GET /api/topics/[slug]]", error);
    return serverErrorResponse();
  }
}
