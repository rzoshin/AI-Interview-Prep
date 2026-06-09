import { auth } from "@/lib/auth";
import { studyService } from "@/services/study.service";
import { evaluateStudyAnswerSchema } from "@/lib/validators/study.schema";
import { aiRateLimit } from "@/lib/redis/rate-limit";
import { isRedisConfigured } from "@/lib/redis/client";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { handleApiError, ValidationError, RateLimitError } from "@/lib/utils/errors";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    if (isRedisConfigured()) {
      const { success } = await aiRateLimit.limit(session.user.id);
      if (!success) throw new RateLimitError("Slow down — too many evaluations. Try again shortly.");
    }

    const { questionId } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = evaluateStudyAnswerSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request");
    }

    const result = await studyService.evaluateAnswer(
      session.user.id,
      questionId,
      parsed.data.answer
    );
    return successResponse(result);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
