import crypto from "crypto";
import OpenAI from "openai";
import { put, list } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { ttsRequestSchema } from "@/lib/validators/ai.schema";
import { aiRateLimit } from "@/lib/redis/rate-limit";
import { isRedisConfigured } from "@/lib/redis/client";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { handleApiError, ValidationError, RateLimitError } from "@/lib/utils/errors";

export const maxDuration = 60;

const TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const TTS_INSTRUCTIONS =
  "Speak in a warm, natural, conversational tone like a friendly but professional technical interviewer. Use clear pacing and gentle inflection.";

function openAiConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return !!key && !key.includes("xxxxx");
}

function blobConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return !!token && token.startsWith("vercel_blob_");
}

// Collapse whitespace so trivially-different inputs share the same cache entry
// and we never pay for synthesizing redundant spaces/newlines.
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// GET /api/ai/tts — lightweight availability probe for the client.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();
    return successResponse({ available: openAiConfigured(), model: TTS_MODEL });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}

// POST /api/ai/tts — returns a playable audio URL. Audio is cached in Vercel
// Blob by content hash, so identical text+voice is only ever synthesized once
// (across all users and sessions), which is the main OpenAI cost saver.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    if (!openAiConfigured()) {
      return errorResponse("Neural TTS is not configured on the server", 503);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = ttsRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request");
    }

    const text = normalizeText(parsed.data.text);
    const voice = parsed.data.voice;
    if (!text) throw new ValidationError("Text is required");

    const hash = crypto
      .createHash("sha256")
      .update(`${TTS_MODEL}:${voice}:${text}`)
      .digest("hex");
    const pathname = `tts/${hash}.mp3`;

    // 1) Cache hit: serve the existing blob URL without calling OpenAI.
    if (blobConfigured()) {
      try {
        const existing = await list({ prefix: pathname, limit: 1 });
        if (existing.blobs.length > 0) {
          return successResponse({ url: existing.blobs[0].url, cached: true });
        }
      } catch {
        // ignore cache lookup failures and synthesize fresh
      }
    }

    // Rate-limit only the calls that actually hit OpenAI.
    if (isRedisConfigured()) {
      const { success } = await aiRateLimit.limit(`tts:${session.user.id}`);
      if (!success) throw new RateLimitError("Too many voice requests. Try again shortly.");
    }

    // 2) Synthesize.
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const speech = await client.audio.speech.create({
      model: TTS_MODEL,
      voice,
      input: text,
      instructions: TTS_INSTRUCTIONS,
      response_format: "mp3",
    });
    const buffer = Buffer.from(await speech.arrayBuffer());

    // 3) Persist to blob (deterministic name) and return the CDN URL, or fall
    // back to an inline data URL when blob storage isn't configured.
    if (blobConfigured()) {
      try {
        const blob = await put(pathname, buffer, {
          access: "public",
          addRandomSuffix: false,
          contentType: "audio/mpeg",
          cacheControlMaxAge: 31536000,
        });
        return successResponse({ url: blob.url, cached: false });
      } catch {
        // fall through to data URL
      }
    }

    const dataUrl = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
    return successResponse({ url: dataUrl, cached: false });
  } catch (error) {
    const { message, status } = handleApiError(error);
    return errorResponse(message, status);
  }
}
