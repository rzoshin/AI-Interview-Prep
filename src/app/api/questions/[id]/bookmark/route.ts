import { auth } from "@/lib/auth";
import { bookmarkRepository } from "@/repositories/bookmark.repository";
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id: questionId } = await params;
    const userId = session.user.id;

    // Idempotent — return existing if already bookmarked
    const existing = await bookmarkRepository.findByUserAndQuestion(userId, questionId);
    if (existing) {
      return successResponse(existing, 200);
    }

    const bookmark = await bookmarkRepository.create({ user: userId, question: questionId });
    return successResponse(bookmark, 201);
  } catch (error) {
    console.error("[POST /api/questions/[id]/bookmark]", error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id: questionId } = await params;
    const userId = session.user.id;

    const deleted = await bookmarkRepository.deleteByUserAndQuestion(userId, questionId);
    if (!deleted) return notFoundResponse("Bookmark");

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("[DELETE /api/questions/[id]/bookmark]", error);
    return serverErrorResponse();
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id: questionId } = await params;
    const bookmark = await bookmarkRepository.findByUserAndQuestion(
      session.user.id,
      questionId
    );

    return successResponse({ bookmarked: !!bookmark, bookmark });
  } catch (error) {
    console.error("[GET /api/questions/[id]/bookmark]", error);
    return serverErrorResponse();
  }
}

export const dynamic = "force-dynamic";
