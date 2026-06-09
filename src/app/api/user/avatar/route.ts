import { auth } from "@/lib/auth";
import { userRepository } from "@/repositories/user.repository";
import { uploadBlob, deleteBlob } from "@/lib/blob/vercel-blob";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return errorResponse("No image file provided", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse("Only JPEG, PNG, WebP, or GIF images are allowed", 400);
    }

    if (file.size > MAX_BYTES) {
      return errorResponse("Image must be 2MB or smaller", 400);
    }

    const user = await userRepository.findById(session.user.id);
    if (!user) return errorResponse("User not found", 404);

    const { url } = await uploadBlob(file, "avatars", file.name);

    if (user.avatar?.includes("blob.vercel-storage.com")) {
      try {
        await deleteBlob(user.avatar);
      } catch {
        // non-fatal if old blob cleanup fails
      }
    }

    const updated = await userRepository.update(session.user.id, { avatar: url });
    if (!updated) return errorResponse("Failed to update profile", 500);

    return successResponse({ avatar: url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    console.error("[POST /api/user/avatar]", error);
    if (message.includes("BLOB_READ_WRITE_TOKEN")) {
      return errorResponse("Avatar storage is not configured", 503);
    }
    return serverErrorResponse();
  }
}
