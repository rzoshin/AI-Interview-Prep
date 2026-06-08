import { topicRepository } from "@/repositories/topic.repository";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/cache";
import { successResponse, serverErrorResponse } from "@/lib/utils/api-response";

interface TopicNode {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentTopic?: string;
  order: number;
  icon?: string;
  questionCount: number;
  createdAt: Date;
  children: TopicNode[];
}

export async function GET() {
  try {
    const cacheKey = CACHE_KEYS.topicsAll();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return successResponse(cached);
    }

    const topics = await topicRepository.findAllWithHierarchy();

    // Build flat list of plain nodes
    const nodeMap = new Map<string, TopicNode>();
    for (const t of topics) {
      nodeMap.set(t._id.toString(), {
        _id: t._id.toString(),
        name: t.name,
        slug: t.slug,
        description: t.description,
        parentTopic: t.parentTopic?.toString(),
        order: t.order,
        icon: t.icon,
        questionCount: t.questionCount,
        createdAt: t.createdAt,
        children: [],
      });
    }

    // Build hierarchy
    const roots: TopicNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parentTopic) {
        const parent = nodeMap.get(node.parentTopic);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    await cache.set(cacheKey, roots, CACHE_TTL.TOPICS_ALL);
    return successResponse(roots);
  } catch (error) {
    console.error("[GET /api/topics]", error);
    return serverErrorResponse();
  }
}
