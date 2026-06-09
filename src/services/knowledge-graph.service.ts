import connectDB from "@/lib/db/mongoose";
import AIAnswer from "@/lib/db/models/AIAnswer";
import { topicRepository } from "@/repositories/topic.repository";
import { progressService } from "@/services/progress.service";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/redis/cache";
import type { ITopic } from "@/types";

export type GraphEdgeType = "hierarchy" | "related";
export type MasteryLevel = "none" | "weak" | "building" | "strong";

export interface GraphNode {
  id: string;
  label: string;
  slug: string;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  questionCount: number;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const H_GAP = 220;
const V_GAP = 140;

function isPopulatedTopic(topic: unknown): topic is ITopic {
  return (
    typeof topic === "object" &&
    topic !== null &&
    "_id" in topic
  );
}

function masteryLevel(score: number): MasteryLevel {
  if (score <= 0) return "none";
  if (score < 50) return "weak";
  if (score < 75) return "building";
  return "strong";
}

function normalizeTopicKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function matchTopicId(relatedName: string, topics: ITopic[]): string | null {
  const key = normalizeTopicKey(relatedName);
  for (const topic of topics) {
    if (
      normalizeTopicKey(topic.name) === key ||
      normalizeTopicKey(topic.slug) === key ||
      normalizeTopicKey(topic.slug.replace(/-/g, " ")) === key
    ) {
      return String(topic._id);
    }
  }
  return null;
}

interface TopicRow {
  _id: unknown;
  name: string;
  slug: string;
  parentTopic?: unknown;
  questionCount: number;
}

function computeLayout(topics: TopicRow[]): Map<string, { x: number; y: number }> {
  const byId = new Map<string, TopicRow>();
  const children = new Map<string, TopicRow[]>();
  const roots: TopicRow[] = [];

  for (const t of topics) {
    byId.set(String(t._id), t);
  }

  for (const t of topics) {
    const parentId = t.parentTopic ? String(t.parentTopic) : null;
    if (parentId && byId.has(parentId)) {
      const list = children.get(parentId) ?? [];
      list.push(t);
      children.set(parentId, list);
    } else {
      roots.push(t);
    }
  }

  const positions = new Map<string, { x: number; y: number }>();

  function layoutSubtree(node: TopicRow, depth: number, offset: number): number {
    const kids = children.get(String(node._id)) ?? [];
    if (kids.length === 0) {
      positions.set(String(node._id), { x: offset * H_GAP, y: depth * V_GAP });
      return offset + 1;
    }

    let cursor = offset;
    for (const child of kids) {
      cursor = layoutSubtree(child, depth + 1, cursor);
    }

    const first = positions.get(String(kids[0]._id))!;
    const last = positions.get(String(kids[kids.length - 1]._id))!;
    positions.set(String(node._id), {
      x: (first.x + last.x) / 2,
      y: depth * V_GAP,
    });

    return cursor;
  }

  let cursor = 0;
  for (const root of roots) {
    cursor = layoutSubtree(root, 0, cursor);
  }

  for (const t of topics) {
    if (!positions.has(String(t._id))) {
      positions.set(String(t._id), { x: cursor * H_GAP, y: 0 });
      cursor++;
    }
  }

  return positions;
}

async function loadRelatedTopicPairs(topics: ITopic[]): Promise<Array<[string, string]>> {
  await connectDB();
  const { questionRepository } = await import("@/repositories/question.repository");
  const answers = await AIAnswer.find(
    { related_topics: { $exists: true, $not: { $size: 0 } } },
    { related_topics: 1, question: 1 }
  ).lean();

  if (answers.length === 0) return [];

  const questionIds = [...new Set(answers.map((a) => String(a.question)))];
  const questions = await questionRepository.findByIds(questionIds);
  const topicByQuestionId = new Map(
    questions.map((q) => [
      String(q._id),
      isPopulatedTopic(q.topic) ? String(q.topic._id) : String(q.topic),
    ])
  );

  const pairs = new Set<string>();
  const result: Array<[string, string]> = [];

  for (const answer of answers) {
    const related = (answer.related_topics as string[]) ?? [];
    if (related.length === 0) continue;

    const sourceTopicId = topicByQuestionId.get(String(answer.question));
    if (!sourceTopicId) continue;

    for (const name of related) {
      const targetId = matchTopicId(name, topics);
      if (targetId && targetId !== sourceTopicId) {
        const key = [sourceTopicId, targetId].sort().join(":");
        if (!pairs.has(key)) {
          pairs.add(key);
          result.push([sourceTopicId, targetId]);
        }
      }
    }
  }

  return result;
}

class KnowledgeGraphService {
  async getGraph(userId: string): Promise<KnowledgeGraphData> {
    const cacheKey = CACHE_KEYS.knowledgeGraph(userId);
    const cached = await cache.get<KnowledgeGraphData>(cacheKey);
    if (cached) return cached;

    const rawTopics = await topicRepository.findMany({}, { limit: 500 });
    const topics = rawTopics as unknown as ITopic[];

    const progress = await progressService.getProgress(userId);
    const masteryByTopic = new Map<string, number>();
    for (const m of progress?.topicMastery ?? []) {
      const topicId =
        m.topic && typeof m.topic === "object"
          ? String((m.topic as ITopic)._id)
          : String(m.topic);
      masteryByTopic.set(topicId, m.score ?? 0);
    }

    const positions = computeLayout(rawTopics as unknown as TopicRow[]);

    const nodes: GraphNode[] = topics.map((t) => {
      const id = String(t._id);
      const score = masteryByTopic.get(id) ?? 0;
      return {
        id,
        label: t.name,
        slug: t.slug,
        masteryScore: score,
        masteryLevel: masteryLevel(score),
        questionCount: t.questionCount ?? 0,
        position: positions.get(id) ?? { x: 0, y: 0 },
      };
    });

    const edges: GraphEdge[] = [];
    const edgeKeys = new Set<string>();

    for (const t of topics) {
      if (t.parentTopic) {
        const parentId = String(t.parentTopic);
        const id = `h-${parentId}-${t._id}`;
        if (!edgeKeys.has(id)) {
          edgeKeys.add(id);
          edges.push({
            id,
            source: parentId,
            target: String(t._id),
            type: "hierarchy",
          });
        }
      }
    }

    const relatedPairs = await loadRelatedTopicPairs(topics);
    for (const [source, target] of relatedPairs) {
      const id = `r-${source}-${target}`;
      if (!edgeKeys.has(id)) {
        edgeKeys.add(id);
        edges.push({ id, source, target, type: "related" });
      }
    }

    const data: KnowledgeGraphData = { nodes, edges };
    await cache.set(cacheKey, data, CACHE_TTL.KNOWLEDGE_GRAPH);
    return data;
  }

  async invalidate(userId: string): Promise<void> {
    await cache.del(CACHE_KEYS.knowledgeGraph(userId));
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();
