import { auth } from "@/lib/auth";
import { pdfUploadRepository } from "@/repositories/pdf-upload.repository";
import { pdfService } from "@/services/pdf.service";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export const maxDuration = 300;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const { id } = await params;
    const upload = await pdfUploadRepository.findById(id);
    if (!upload) return notFoundResponse("Upload");

    return successResponse({
      _id: upload._id,
      originalName: upload.originalName,
      status: upload.status,
      extractedCount: upload.extractedCount,
      errorMessage: (upload as { errorMessage?: string }).errorMessage,
      createdAt: upload.createdAt,
    });
  } catch (error) {
    console.error("[GET /api/admin/pdf/[id]/status]", error);
    return serverErrorResponse();
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const { id } = await params;
    const upload = await pdfUploadRepository.findById(id);
    if (!upload) return notFoundResponse("Upload");

    // Allow re-triggering extraction if previously failed
    if (upload.status === "processing") {
      return successResponse({ message: "Extraction already in progress" });
    }

    const result = await pdfService.extract(id);

    return successResponse({
      questions: result.questions,
      pageCount: result.pageCount,
      extractedCount: result.questions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed";
    console.error("[POST /api/admin/pdf/[id]/status]", error);
    return successResponse({ error: message }, 200);
  }
}
