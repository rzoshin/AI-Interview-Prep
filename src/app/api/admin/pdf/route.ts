import { auth } from "@/lib/auth";
import { pdfService } from "@/services/pdf.service";
import { pdfUploadRepository } from "@/repositories/pdf-upload.repository";
import {
  successResponse,
  paginatedResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    const { uploadId, fileUrl } = await pdfService.upload(file, session.user.id);

    // Fire-and-forget extraction — client polls /api/admin/pdf/[id]/status
    pdfService.extract(uploadId).catch((err) => {
      console.error(`[PDF extraction failed for ${uploadId}]`, err);
    });

    return successResponse({ uploadId, fileUrl, status: "processing" }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[POST /api/admin/pdf]", error);
    return errorResponse(message, 400);
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);

    const [uploads, total] = await Promise.all([
      pdfUploadRepository.findMany({}, { page, limit }),
      pdfUploadRepository.count({}),
    ]);

    const totalPages = Math.ceil(total / limit);
    return paginatedResponse(uploads, {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    });
  } catch (error) {
    console.error("[GET /api/admin/pdf]", error);
    return serverErrorResponse();
  }
}
