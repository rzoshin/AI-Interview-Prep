import { auth } from "@/lib/auth";
import { progressService } from "@/services/progress.service";
import { completeQuestionSchema } from "@/lib/validators/progress.schema";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import { handleApiError, ValidationError } from "@/lib/utils/errors";

// POST /api/progress/complete — mark a question as completed.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const parsed = completeQuestionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request");
    }

    await progressService.markComplete(session.user.id, parsed.data.questionId);
    return successResponse({ ok: true });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
