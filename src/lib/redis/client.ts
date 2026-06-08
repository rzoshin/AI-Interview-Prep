import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

/**
 * Returns true only when Upstash Redis is configured with real (non-placeholder)
 * credentials. When false, the cache layer should skip Redis entirely instead of
 * making HTTP calls to an unreachable host (which would hang every request).
 */
export function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  // Placeholder values shipped in .env.local.example / .env.local
  if (url.includes("xxxxx")) return false;
  if (token.includes("xxxxx") || token === "your-upstash-token") return false;
  return true;
}

export function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis environment variables are not defined");
  }

  _redis = new Redis({ url, token });
  return _redis;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return getRedis()[prop as keyof Redis];
  },
});

export default redis;
