import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validators/auth.schema";
import { userRepository } from "@/repositories/user.repository";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const updated = await userRepository.update(session.user.id, parsed.data);
    if (!updated) return errorResponse("User not found", 404);

    return successResponse(updated);
  } catch (error) {
    console.error("[profile PATCH]", error);
    return serverErrorResponse();
  }
}
