import { auth } from "@/lib/auth";
import { aiService } from "@/services/ai.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";

export const maxDuration = 60;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { topicId } = await params;
    const force = new URL(req.url).searchParams.get("force") === "true";

    const result = await aiService.getTopicQuiz(topicId, { force });
    return successResponse(result);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
