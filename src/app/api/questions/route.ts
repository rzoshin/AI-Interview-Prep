import { auth } from "@/lib/auth";
import { questionService } from "@/services/question.service";
import { questionRepository } from "@/repositories/question.repository";
import { questionFiltersSchema, createQuestionSchema } from "@/lib/validators/question.schema";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const raw = {
      topic: searchParams.get("topic") ?? undefined,
      difficulty: searchParams.get("difficulty") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      tags: searchParams.getAll("tags"),
      isPublished: searchParams.get("isPublished") ?? undefined,
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "20",
    };

    const parsed = questionFiltersSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { page, limit, ...filters } = parsed.data;

    // Non-admin users only see published questions
    const session = await auth();
    if (session?.user?.role !== "admin") {
      filters.isPublished = true;
    }

    const { questions, total } = await questionService.list(filters, page, limit);

    const totalPages = Math.ceil(total / limit);
    return paginatedResponse(questions, {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const body = await req.json();
    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const contentHash = crypto
      .createHash("sha256")
      .update(parsed.data.question.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim())
      .digest("hex");

    const question = await questionRepository.create({ ...parsed.data, contentHash });
    await questionService.invalidateQuestionCache();

    return successResponse(question, 201);
  } catch (error) {
    console.error("[POST /api/questions]", error);
    return serverErrorResponse();
  }
}
