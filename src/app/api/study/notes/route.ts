import { auth } from "@/lib/auth";
import { studyService } from "@/services/study.service";
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const notes = await studyService.listNotes(session.user.id);
    return successResponse(notes);
  } catch (error) {
    const { status } = handleApiError(error);
    if (status >= 500) {
      console.error("[GET /api/study/notes]", error);
      return serverErrorResponse();
    }
    return successResponse([]);
  }
}
