import { auth } from "@/lib/auth";
import { promptRepository } from "@/repositories/prompt.repository";
import { createPromptSchema } from "@/lib/validators/prompt.schema";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/errors";

function nextVersion(current: string | null): string {
  if (!current) return "v1";
  const match = current.match(/^v(\d+)$/i);
  if (match) return `v${parseInt(match[1], 10) + 1}`;
  return `${current}-next`;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const prompts = await promptRepository.findMany({}, { limit: 200 });
    return successResponse(prompts);
  } catch (error) {
    console.error("[GET /api/admin/prompts]", error);
    return serverErrorResponse();
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return unauthorizedResponse();
    if (session.user.role !== "admin") return forbiddenResponse();

    const body = await req.json();
    const parsed = createPromptSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { name, content, aiModel, isActive } = parsed.data;
    const version =
      parsed.data.version ?? nextVersion(await promptRepository.findLatestVersion(name));

    const prompt = await promptRepository.create({
      name,
      content,
      aiModel,
      version,
      isActive,
    });

    return successResponse(prompt, 201);
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
