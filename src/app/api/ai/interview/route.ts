import { auth } from "@/lib/auth";
import { interviewService } from "@/services/interview.service";
import { startInterviewSchema } from "@/lib/validators/ai.schema";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { handleApiError, ValidationError } from "@/lib/utils/errors";

export const maxDuration = 60;

// POST /api/ai/interview — start a new interview session.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const parsed = startInterviewSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request");
    }

    const result = await interviewService.startSession(session.user.id, parsed.data);
    return successResponse(result, 201);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

// GET /api/ai/interview — list the current user's past interview sessions.
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;

    const sessions = await interviewService.getHistory(session.user.id, { page, limit });
    return successResponse(sessions);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
