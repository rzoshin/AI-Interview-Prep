import { auth } from "@/lib/auth";
import { progressService } from "@/services/progress.service";
import { recordQuizSchema } from "@/lib/validators/progress.schema";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import { handleApiError, ValidationError } from "@/lib/utils/errors";

// POST /api/progress/quiz — record a topic quiz result into mastery.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const parsed = recordQuizSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request");
    }

    await progressService.recordQuizResult(session.user.id, parsed.data);
    return successResponse({ ok: true });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
