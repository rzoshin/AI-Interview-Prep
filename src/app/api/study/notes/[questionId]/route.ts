import { auth } from "@/lib/auth";
import { studyService } from "@/services/study.service";
import { saveStudyNoteSchema } from "@/lib/validators/study.schema";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { handleApiError, ValidationError } from "@/lib/utils/errors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { questionId } = await params;
    const note = await studyService.getNote(session.user.id, questionId);
    return successResponse(note);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { questionId } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = saveStudyNoteSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request");
    }

    const note = await studyService.saveNote(
      session.user.id,
      questionId,
      parsed.data.content
    );
    return successResponse(note);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
