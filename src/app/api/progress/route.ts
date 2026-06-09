import { auth } from "@/lib/auth";
import { progressService } from "@/services/progress.service";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";

// GET /api/progress — current user's progress summary.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const progress = await progressService.getProgress(session.user.id);
    return successResponse(progress);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
