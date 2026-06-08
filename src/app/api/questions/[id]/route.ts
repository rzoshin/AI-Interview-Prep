import { auth } from "@/lib/auth";
import { questionService } from "@/services/question.service";
import { questionRepository } from "@/repositories/question.repository";
import { updateQuestionSchema } from "@/lib/validators/question.schema";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await questionService.getById(id);
    if (!question) return notFoundResponse("Question");

    const session = await auth();
    if (!question.isPublished && session?.user?.role !== "admin") {
      return notFoundResponse("Question");
    }

    return successResponse(question);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const updated = await questionRepository.update(id, parsed.data);
    if (!updated) return notFoundResponse("Question");

    await questionService.invalidateQuestionCache(id);
    return successResponse(updated);
  } catch (error) {
    console.error("[PUT /api/questions/[id]]", error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const { id } = await params;
    const deleted = await questionRepository.delete(id);
    if (!deleted) return notFoundResponse("Question");

    await questionService.invalidateQuestionCache(id);
    return successResponse({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/questions/[id]]", error);
    return serverErrorResponse();
  }
}
