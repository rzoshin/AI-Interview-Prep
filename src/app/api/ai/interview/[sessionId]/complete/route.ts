import { auth } from "@/lib/auth";
import { interviewService } from "@/services/interview.service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";

// POST /api/ai/interview/[sessionId]/complete — finalize the session.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { sessionId } = await params;
    const result = await interviewService.completeSession(session.user.id, sessionId);
    return successResponse(result);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
