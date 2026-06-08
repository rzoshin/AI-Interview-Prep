import { NextResponse } from "next/server";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "@/types/api";

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  status = 200
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({ success: true, data, meta }, { status });
}

export function unauthorizedResponse(message = "Unauthorized"): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = "Forbidden"): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = "Not found"): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

export function serverErrorResponse(message = "Internal server error"): NextResponse<ApiResponse> {
  return errorResponse(message, 500);
}
