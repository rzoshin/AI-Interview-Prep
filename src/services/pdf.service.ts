import crypto from "crypto";
import OpenAI from "openai";
import { uploadBlob, deleteBlob } from "@/lib/blob/vercel-blob";
import { pdfUploadRepository } from "@/repositories/pdf-upload.repository";
import { questionRepository } from "@/repositories/question.repository";
import { topicRepository } from "@/repositories/topic.repository";
import { questionService } from "./question.service";

export interface ExtractedQuestion {
  question: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  source?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
  duplicateSimilarity?: number;
}

interface ExtractionResult {
  questions: ExtractedQuestion[];
  rawText: string;
  pageCount: number;
}

const CHUNK_SIZE = 6000;
const MAX_CHUNKS = 10;

const OPENAI_MODEL = "gpt-4o-mini";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Groq exposes an OpenAI-compatible API, so we reuse the same SDK pointed at
// their endpoint. Used as a fallback when the primary (OpenAI) call fails
// (e.g. quota exceeded). Only initialised when a key is configured.
const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

async function extractTextFromBuffer(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  // Dynamic import to avoid Next.js build-time issues with pdf-parse
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return { text: data.text, numpages: data.numpages };
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length && chunks.length < MAX_CHUNKS) {
    const end = Math.min(start + size, text.length);
    const lastBreak = text.lastIndexOf("\n", end);
    const boundary = lastBreak > start ? lastBreak : end;
    chunks.push(text.slice(start, boundary).trim());
    start = boundary + 1;
  }
  return chunks.filter((c) => c.length > 50);
}

async function callLLM(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<ExtractedQuestion[]> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  const items: ExtractedQuestion[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.questions)
    ? parsed.questions
    : [];

  return items.filter(
    (q) => q.question && q.question.length >= 10 && q.topic && q.difficulty
  );
}

async function extractQuestionsFromChunk(chunk: string, source: string): Promise<ExtractedQuestion[]> {
  const systemPrompt = `You are an expert at extracting interview questions from text.
Extract all interview questions from the provided text and return them as a JSON array.
For each question, identify:
- The question text (complete, clear)
- The topic/category (e.g., "JavaScript", "System Design", "Data Structures", "React", "Node.js", "CSS", "TypeScript", etc.)
- Difficulty level: "easy", "medium", or "hard"
- Relevant tags (array of keywords)

Return ONLY a valid JSON array. If no questions found, return [].`;

  const userPrompt = `Extract interview questions from this text. Source: "${source}"

Text:
${chunk}

Return JSON array format:
[{"question": "...", "topic": "...", "difficulty": "easy|medium|hard", "tags": ["tag1", "tag2"]}]`;

  try {
    return await callLLM(openai, OPENAI_MODEL, systemPrompt, userPrompt);
  } catch (error) {
    if (!groq) throw error;
    console.warn(
      `[pdf.extract] OpenAI call failed (${
        error instanceof Error ? error.message : "unknown error"
      }). Falling back to Groq (${GROQ_MODEL}).`
    );
    return callLLM(groq, GROQ_MODEL, systemPrompt, userPrompt);
  }
}

// Maps detectable keywords (matched against question text) to a canonical topic.
const TOPIC_KEYWORDS: Array<{ topic: string; patterns: RegExp[] }> = [
  { topic: "React", patterns: [/\breact\b/i, /\bjsx\b/i, /\bhooks?\b/i, /\buseState\b/i, /\buseEffect\b/i] },
  { topic: "TypeScript", patterns: [/\btypescript\b/i, /\bts\b/i, /\binterface\b/i, /\bgenerics?\b/i] },
  { topic: "JavaScript", patterns: [/\bjavascript\b/i, /\bjs\b/i, /\bclosure\b/i, /\bpromise\b/i, /\basync\b/i, /\bevent loop\b/i, /\bhoisting\b/i] },
  { topic: "CSS", patterns: [/\bcss\b/i, /\bflexbox\b/i, /\bgrid\b/i, /\bselector\b/i] },
  { topic: "HTML", patterns: [/\bhtml\b/i, /\bsemantic\b/i, /\bdom\b/i] },
  { topic: "Node.js", patterns: [/\bnode\.?js\b/i, /\bexpress\b/i, /\bmiddleware\b/i, /\bnpm\b/i] },
  { topic: "System Design", patterns: [/\bsystem design\b/i, /\bscalab/i, /\bload balanc/i, /\bcaching\b/i, /\bmicroservice/i] },
  { topic: "Databases", patterns: [/\bsql\b/i, /\bdatabase\b/i, /\bmongodb\b/i, /\bindex(es|ing)?\b/i, /\bnormaliz/i, /\bjoin\b/i] },
  { topic: "Data Structures & Algorithms", patterns: [/\bdata structure/i, /\balgorithm/i, /\bbig o\b/i, /\bcomplexity\b/i, /\bsort(ing)?\b/i, /\blinked list\b/i, /\bbinary tree\b/i] },
];

function deriveTopicFromFileName(source: string): string {
  const base = source
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\bq\s*&?\s*a\b/gi, "")
    .replace(/\bqna\b/gi, "")
    .replace(/\bquestions?\b/gi, "")
    .replace(/\banswers?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return base.length >= 2 ? base : "General";
}

function deriveTopicAndTags(question: string, fallbackTopic: string): { topic: string; tags: string[] } {
  const tags: string[] = [];
  let topic: string | null = null;

  for (const { topic: t, patterns } of TOPIC_KEYWORDS) {
    if (patterns.some((p) => p.test(question))) {
      if (!topic) topic = t;
      tags.push(t);
    }
  }

  return { topic: topic ?? fallbackTopic, tags };
}

function cleanQuestionText(raw: string): string {
  return raw
    .replace(/^\s*(?:q(?:uestion)?\s*\d*\s*[:.\-)]?\s*)/i, "")
    .replace(/^\s*\d+\s*[.):\-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Dependency-free parser used when the LLM is unavailable (e.g. quota exceeded).
// Detects questions from common interview-PDF patterns and derives best-effort
// topic/difficulty/tags locally, returning the same shape as the AI path.
function heuristicExtract(text: string, source: string): ExtractedQuestion[] {
  const fallbackTopic = deriveTopicFromFileName(source);
  const candidates: string[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const prefixPattern = /^\s*(?:q(?:uestion)?\s*\d*\s*[:.\-)]|\d+\s*[.):\-])\s*/i;

  let buffer = "";
  const flush = () => {
    if (buffer) {
      candidates.push(buffer);
      buffer = "";
    }
  };

  for (const line of lines) {
    if (prefixPattern.test(line)) {
      // New labeled/numbered question starts here.
      flush();
      buffer = line;
    } else if (buffer) {
      // Continuation of the current question until it terminates.
      buffer += " " + line;
    } else if (line.endsWith("?")) {
      // Standalone question line with no prefix.
      candidates.push(line);
    }

    if (buffer.includes("?")) {
      // Stop accumulating once the question mark is reached.
      flush();
    }
  }
  flush();

  const seen = new Set<string>();
  const results: ExtractedQuestion[] = [];

  for (const candidate of candidates) {
    const cleaned = cleanQuestionText(candidate);
    if (cleaned.length < 10) continue;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const { topic, tags } = deriveTopicAndTags(cleaned, fallbackTopic);
    results.push({
      question: cleaned,
      topic,
      difficulty: "medium",
      tags,
      source,
    });
  }

  return results;
}

class PDFService {
  async upload(
    file: File,
    adminId: string
  ): Promise<{ uploadId: string; fileUrl: string }> {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Only PDF files are allowed");
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new Error("File size must be under 20MB");
    }

    const { url } = await uploadBlob(file, "pdfs", file.name);

    const upload = await pdfUploadRepository.create({
      uploadedBy: adminId,
      fileUrl: url,
      originalName: file.name,
    });

    return { uploadId: upload._id.toString(), fileUrl: url };
  }

  async extract(uploadId: string): Promise<ExtractionResult> {
    await pdfUploadRepository.update(uploadId, { status: "processing" });

    try {
      const upload = await pdfUploadRepository.findById(uploadId);
      if (!upload) throw new Error("Upload record not found");

      const response = await fetch(upload.fileUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF from storage");

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { text, numpages } = await extractTextFromBuffer(buffer);

      const chunks = chunkText(text, CHUNK_SIZE);
      console.log(
        `[pdf.extract] ${upload.originalName}: ${numpages} pages, ${text.length} chars of text, ${chunks.length} chunk(s) to process.`
      );
      if (chunks.length === 0) {
        console.warn(
          "[pdf.extract] No usable text extracted. The PDF may be image-based/scanned (needs OCR) or empty."
        );
      }

      let allExtracted: ExtractedQuestion[] = [];
      let aiError: unknown = null;

      try {
        for (const chunk of chunks) {
          const questions = await extractQuestionsFromChunk(chunk, upload.originalName);
          allExtracted.push(...questions);
        }
      } catch (error) {
        aiError = error;
        console.error("[pdf.extract] OpenAI extraction failed:", error);
      }

      // Fall back to the dependency-free parser when the LLM fails (e.g. quota
      // exceeded) or produces nothing usable.
      if (aiError || allExtracted.length === 0) {
        const reason = aiError
          ? aiError instanceof Error
            ? aiError.message
            : "AI error"
          : "no AI results";
        allExtracted = heuristicExtract(text, upload.originalName);
        console.log(
          `[pdf.extract] AI unavailable/empty (${reason}); used heuristic parser -> ${allExtracted.length} question(s).`
        );
      }

      console.log(
        `[pdf.extract] Extracted ${allExtracted.length} raw question(s) from ${chunks.length} chunk(s).`
      );

      // Dedup within the extracted set (same chunk may repeat)
      const seen = new Set<string>();
      const unique: ExtractedQuestion[] = [];
      for (const q of allExtracted) {
        const hash = crypto
          .createHash("md5")
          .update(q.question.toLowerCase().trim())
          .digest("hex");
        if (!seen.has(hash)) {
          seen.add(hash);
          unique.push(q);
        }
      }

      // Run duplicate detection against existing DB
      const withDupCheck = await Promise.all(
        unique.map(async (q) => {
          const result = await questionService.detectDuplicate(q.question);
          return {
            ...q,
            source: upload.originalName,
            isDuplicate: result.isDuplicate,
            duplicateOf: result.existingId,
            duplicateSimilarity: result.similarity,
          };
        })
      );

      await pdfUploadRepository.update(uploadId, {
        status: "done",
        extractedCount: withDupCheck.length,
      });

      return {
        questions: withDupCheck,
        rawText: text.slice(0, 500),
        pageCount: numpages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Extraction failed";
      await pdfUploadRepository.update(uploadId, {
        status: "failed",
        errorMessage: message,
      });
      throw error;
    }
  }

  async bulkImport(
    uploadId: string,
    approvedQuestions: ExtractedQuestion[]
  ): Promise<{ imported: number; skipped: number }> {
    const upload = await pdfUploadRepository.findById(uploadId);
    if (!upload) throw new Error("Upload record not found");

    const nonDuplicates = approvedQuestions.filter((q) => !q.isDuplicate);
    if (nonDuplicates.length === 0) return { imported: 0, skipped: approvedQuestions.length };

    // Resolve topic names to IDs (or create topics if missing)
    const topicMap = new Map<string, string>();
    for (const q of nonDuplicates) {
      const topicName = q.topic.trim();
      if (topicMap.has(topicName)) continue;

      const slug = topicName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      let topic = await topicRepository.findBySlug(slug);
      if (!topic) {
        topic = await topicRepository.create({ name: topicName, slug, order: 0 });
      }
      topicMap.set(topicName, topic._id.toString());
    }

    const dtos = nonDuplicates.map((q) => ({
      topic: topicMap.get(q.topic.trim()) as string,
      question: q.question,
      difficulty: q.difficulty,
      tags: q.tags ?? [],
      source: q.source ?? upload.originalName,
      isPublished: false,
      contentHash: crypto
        .createHash("sha256")
        .update(q.question.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim())
        .digest("hex"),
    }));

    const created = await questionRepository.bulkCreate(dtos);

    // Update questionCount per topic
    const topicCounts = new Map<string, number>();
    for (const dto of dtos) {
      topicCounts.set(dto.topic, (topicCounts.get(dto.topic) ?? 0) + 1);
    }
    await Promise.all(
      Array.from(topicCounts.entries()).map(([topicId, count]) =>
        topicRepository.incrementQuestionCount(topicId, count)
      )
    );

    // Invalidate question list cache
    await questionService.invalidateQuestionCache();

    return {
      imported: created.length,
      skipped: approvedQuestions.length - nonDuplicates.length,
    };
  }

  async deleteUpload(uploadId: string): Promise<void> {
    const upload = await pdfUploadRepository.findById(uploadId);
    if (upload?.fileUrl) {
      try {
        await deleteBlob(upload.fileUrl);
      } catch {
        // Best-effort delete from storage
      }
    }
    await pdfUploadRepository.delete(uploadId);
  }
}

export const pdfService = new PDFService();
