import { auth } from "@/lib/auth";
import { successResponse, unauthorizedResponse } from "@/lib/utils/api-response";
import connectDB from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) return unauthorizedResponse();

  return successResponse(user);
}
