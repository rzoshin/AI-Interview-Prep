import crypto from "crypto";
import { questionRepository, type QuestionFilter } from "@/repositories/question.repository";
import { topicRepository } from "@/repositories/topic.repository";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/cache";
import type { IQuestion, ITopic } from "@/types/index";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId?: string;
  similarity: number;
  type: "exact" | "fuzzy" | "none";
}

export interface QuestionWithTopic extends Omit<IQuestion, "topic"> {
  topic: ITopic | string;
  contentHash?: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();
}

function hashText(text: string): string {
  return crypto.createHash("sha256").update(normalizeText(text)).digest("hex");
}

function buildFiltersHash(filters: QuestionFilter): string {
  const key = JSON.stringify({
    topic: filters.topic ?? "",
    difficulty: filters.difficulty ?? "",
    search: filters.search ?? "",
    tags: (filters.tags ?? []).sort().join(","),
    isPublished: filters.isPublished ?? "",
  });
  return crypto.createHash("md5").update(key).digest("hex").slice(0, 8);
}

class QuestionService {
  async list(
    filters: QuestionFilter,
    page = 1,
    limit = 20
  ): Promise<{ questions: QuestionWithTopic[]; total: number }> {
    const filtersHash = buildFiltersHash(filters);
    const cacheKey = CACHE_KEYS.questionsList(filters.topic ?? "all", page, filtersHash);

    const cached = await cache.get<{ questions: QuestionWithTopic[]; total: number }>(cacheKey);
    if (cached) return cached;

    const [questions, total] = await Promise.all([
      questionRepository.findWithFilters(filters, { page, limit }),
      questionRepository.count(buildMongoFilter(filters)),
    ]);

    const result = {
      questions: questions as unknown as QuestionWithTopic[],
      total,
    };

    await cache.set(cacheKey, result, CACHE_TTL.QUESTIONS_LIST);
    return result;
  }

  async getById(id: string): Promise<QuestionWithTopic | null> {
    const cacheKey = CACHE_KEYS.questionSingle(id);
    const cached = await cache.get<QuestionWithTopic>(cacheKey);
    if (cached) return cached;

    const question = await questionRepository.findById(id);
    if (!question) return null;

    const result = question as unknown as QuestionWithTopic;
    await cache.set(cacheKey, result, CACHE_TTL.QUESTION_SINGLE);
    return result;
  }

  async detectDuplicate(text: string): Promise<DuplicateCheckResult> {
    const hash = hashText(text);

    const exactMatch = await questionRepository.findByHash(hash);
    if (exactMatch) {
      return {
        isDuplicate: true,
        existingId: exactMatch._id.toString(),
        similarity: 1.0,
        type: "exact",
      };
    }

    const normalized = normalizeText(text);
    if (normalized.split(" ").length < 4) {
      return { isDuplicate: false, similarity: 0, type: "none" };
    }

    try {
      const similar = await questionRepository.findSimilar(normalized.slice(0, 200), 3);
      if (similar.length > 0) {
        return {
          isDuplicate: true,
          existingId: similar[0]._id.toString(),
          similarity: 0.9,
          type: "fuzzy",
        };
      }
    } catch {
      // Text index may not be set up yet — treat as no match
    }

    return { isDuplicate: false, similarity: 0, type: "none" };
  }

  async invalidateQuestionCache(questionId?: string): Promise<void> {
    await Promise.all([
      cache.invalidatePattern("q:list:"),
      ...(questionId ? [cache.del(CACHE_KEYS.questionSingle(questionId))] : []),
    ]);
  }

  async getTopicById(id: string) {
    return topicRepository.findById(id);
  }
}

function buildMongoFilter(filters: QuestionFilter): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  if (filters.topic) query.topic = filters.topic;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.tags?.length) query.tags = { $in: filters.tags };
  if (filters.isPublished !== undefined) query.isPublished = filters.isPublished;
  if (filters.search) query.$text = { $search: filters.search };
  return query;
}

export const questionService = new QuestionService();
