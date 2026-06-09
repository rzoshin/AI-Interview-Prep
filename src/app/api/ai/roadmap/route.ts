import { auth } from "@/lib/auth";
import { roadmapService } from "@/services/roadmap.service";
import { aiRateLimit } from "@/lib/redis/rate-limit";
import { isRedisConfigured } from "@/lib/redis/client";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import { handleApiError, RateLimitError } from "@/lib/utils/errors";

export const maxDuration = 60;

// GET /api/ai/roadmap — the current user's saved roadmap (or null).
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const roadmap = await roadmapService.getCurrent(session.user.id);
    return successResponse(roadmap);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

// POST /api/ai/roadmap — generate (or regenerate) a personalized roadmap.
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    if (isRedisConfigured()) {
      const { success } = await aiRateLimit.limit(session.user.id);
      if (!success) {
        throw new RateLimitError("Slow down — too many roadmap requests. Try again shortly.");
      }
    }

    const roadmap = await roadmapService.generate(session.user.id);
    return successResponse(roadmap, 201);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
