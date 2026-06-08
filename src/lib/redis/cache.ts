import { redis, isRedisConfigured } from "./client";

export const CACHE_TTL = {
  QUESTIONS_LIST: 600,      // 10 min
  QUESTION_SINGLE: 1800,    // 30 min
  AI_ANSWER: 86400,         // 24 h
  TOPICS_ALL: 3600,         // 1 h
  PROGRESS: 300,            // 5 min
} as const;

export const CACHE_KEYS = {
  questionsList: (topicId: string, page: number, filtersHash: string) =>
    `q:list:${topicId}:${page}:${filtersHash}`,
  questionSingle: (questionId: string) => `q:single:${questionId}`,
  aiAnswer: (questionId: string) => `ai:answer:${questionId}`,
  topicsAll: () => `topics:all`,
  progress: (userId: string) => `progress:${userId}`,
} as const;

async function get<T>(key: string): Promise<T | null> {
  if (!isRedisConfigured()) return null;
  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    return null;
  }
}

async function set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!isRedisConfigured()) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // silently fail — cache is best-effort
  }
}

async function del(...keys: string[]): Promise<void> {
  if (!isRedisConfigured()) return;
  try {
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // silently fail
  }
}

async function invalidatePattern(prefix: string): Promise<void> {
  if (!isRedisConfigured()) return;
  try {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { match: `${prefix}*`, count: 100 });
      cursor = Number(result[0]);
      const keys = result[1] as string[];
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== 0);
  } catch {
    // silently fail
  }
}

export const cache = { get, set, del, invalidatePattern };
export default cache;
