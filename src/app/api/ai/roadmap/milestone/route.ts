import { z } from "zod";
import { auth } from "@/lib/auth";
import { roadmapService } from "@/services/roadmap.service";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import { handleApiError, ValidationError } from "@/lib/utils/errors";

const toggleSchema = z.object({
  order: z.coerce.number().int().min(0),
});

// PATCH /api/ai/roadmap/milestone — toggle a milestone's completed flag.
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request");
    }

    const roadmap = await roadmapService.toggleMilestone(session.user.id, parsed.data.order);
    return successResponse(roadmap);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
