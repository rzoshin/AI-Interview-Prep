import { auth } from "@/lib/auth";
import { knowledgeGraphService } from "@/services/knowledge-graph.service";
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

    const graph = await knowledgeGraphService.getGraph(session.user.id);
    return successResponse(graph);
  } catch (error) {
    const { message, status } = handleApiError(error);
    if (status >= 500) {
      console.error("[GET /api/knowledge-graph]", error);
      return serverErrorResponse();
    }
    return successResponse({ nodes: [], edges: [] });
  }
}
