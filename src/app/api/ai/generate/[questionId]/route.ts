import { auth } from "@/lib/auth";
import { aiService } from "@/services/ai.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";

export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { questionId } = await params;
    const force = new URL(req.url).searchParams.get("force") === "true";

    // Forced regeneration is admin-only; first-time generation is open to any user.
    if (force && session.user.role !== "admin") return forbiddenResponse();

    const answer = await aiService.generateAnswers(questionId, { force });
    return successResponse(answer);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
