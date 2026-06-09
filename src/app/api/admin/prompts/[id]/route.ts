import { auth } from "@/lib/auth";
import { promptRepository } from "@/repositories/prompt.repository";
import { updatePromptSchema } from "@/lib/validators/prompt.schema";
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
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const { id } = await params;
    const prompt = await promptRepository.findById(id);
    if (!prompt) return notFoundResponse("Prompt");

    return successResponse(prompt);
  } catch (error) {
    console.error("[GET /api/admin/prompts/[id]]", error);
    return serverErrorResponse();
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
    const parsed = updatePromptSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const updated = await promptRepository.update(id, parsed.data);
    if (!updated) return notFoundResponse("Prompt");

    return successResponse(updated);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
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
    const deleted = await promptRepository.delete(id);
    if (!deleted) return notFoundResponse("Prompt");

    return successResponse({ deleted: true });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
