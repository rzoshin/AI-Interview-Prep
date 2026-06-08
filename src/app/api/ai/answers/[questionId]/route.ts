import { auth } from "@/lib/auth";
import { aiService } from "@/services/ai.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { questionId } = await params;
    const answer = await aiService.getAnswer(questionId);
    return successResponse(answer);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
