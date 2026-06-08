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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
  } catch {
    return [];
  }
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
      const allExtracted: ExtractedQuestion[] = [];

      for (const chunk of chunks) {
        const questions = await extractQuestionsFromChunk(chunk, upload.originalName);
        allExtracted.push(...questions);
      }

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
