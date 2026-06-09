import type { ITopic, TopicMastery } from "@/types";

// topicMastery.topic is populated with { name, slug } when read via the
// repository, but may be a bare id string from the cache or before population.
export function masteryTopicName(entry: TopicMastery): string {
  const topic = entry.topic;
  if (topic && typeof topic === "object") {
    return (topic as ITopic).name ?? "Unknown";
  }
  return "Topic";
}

export function masteryTopicSlug(entry: TopicMastery): string | null {
  const topic = entry.topic;
  if (topic && typeof topic === "object") {
    return (topic as ITopic).slug ?? null;
  }
  return null;
}
