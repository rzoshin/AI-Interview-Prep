import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongoose";
import User from "@/lib/db/models/User";
import { registerSchema } from "@/lib/validators/auth.schema";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message);
    }

    const { name, email, password } = parsed.data;

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) return errorResponse("An account with this email already exists", 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, hashedPassword });

    const { hashedPassword: _, ...safeUser } = user.toObject();
    return successResponse(safeUser, 201);
  } catch (error) {
    console.error("[register]", error);
    return serverErrorResponse();
  }
}
