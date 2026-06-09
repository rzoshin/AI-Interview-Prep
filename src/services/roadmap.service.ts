import { roadmapRepository } from "@/repositories/roadmap.repository";
import { topicRepository } from "@/repositories/topic.repository";
import { progressService } from "@/services/progress.service";
import { getAIClient } from "@/lib/ai/client";
import { getActivePromptContent } from "@/lib/ai/prompt-loader";
import {
  buildRoadmapUserPrompt,
  getDefaultRoadmapSystemPrompt,
} from "@/lib/ai/prompts/roadmap.prompt";
import { roadmapSchema } from "@/lib/validators/ai.schema";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import type { IRoadmap, ITopic, RoadmapLevel } from "@/types";

const WEAK_THRESHOLD = 50;
const STRONG_THRESHOLD = 75;

class RoadmapService {
  async getCurrent(userId: string): Promise<IRoadmap | null> {
    const roadmap = await roadmapRepository.findByUserId(userId);
    return roadmap as unknown as IRoadmap | null;
  }

  // Generates a personalized roadmap from the user's progress + available
  // topics, then persists it (one roadmap per user, replaced on regeneration).
  async generate(userId: string): Promise<IRoadmap> {
    const topics = await topicRepository.findMany({});
    if (topics.length === 0) {
      throw new NotFoundError("No topics available to build a roadmap from");
    }

    const progress = await progressService.getProgress(userId);

    // topicId -> mastery score (0-100).
    const masteryById = new Map<string, number>();
    const weakNames: string[] = [];
    const strongNames: string[] = [];
    for (const m of progress?.topicMastery ?? []) {
      const topicId =
        m.topic && typeof m.topic === "object"
          ? String((m.topic as ITopic)._id)
          : String(m.topic);
      const name =
        m.topic && typeof m.topic === "object" ? (m.topic as ITopic).name : undefined;
      masteryById.set(topicId, m.score);
      if (name && m.score < WEAK_THRESHOLD) weakNames.push(name);
      if (name && m.score >= STRONG_THRESHOLD) strongNames.push(name);
    }

    const topicInputs = topics.map((t) => ({
      name: t.name,
      slug: t.slug,
      mastery: masteryById.get(String(t._id)) ?? 0,
    }));

    const ai = getAIClient();
    if (!ai) {
      throw new Error(
        "No AI provider configured. Add GROQ_API_KEY (free at console.groq.com) to .env.local."
      );
    }

    const roadmapPrompt = await getActivePromptContent("roadmap", getDefaultRoadmapSystemPrompt);
    const user = buildRoadmapUserPrompt({
      topics: topicInputs,
      weakAreas: weakNames,
      strongAreas: strongNames,
      readinessScore: progress?.readinessScore ?? 0,
      completedCount: progress?.completedQuestions?.length ?? 0,
    });

    let parsed;
    try {
      const response = await ai.client.chat.completions.create({
        model: ai.model,
        messages: [
          { role: "system", content: roadmapPrompt.content },
          { role: "user", content: user },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content ?? "{}";
      parsed = roadmapSchema.parse(JSON.parse(content));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown error";
      console.error("[roadmap.generate] generation failed:", error);
      throw new Error(`Roadmap generation failed: ${reason}`);
    }

    // Map slugs back to topic ids; drop milestones that don't match a real topic.
    const topicBySlug = new Map(topics.map((t) => [t.slug, t]));
    const milestones = parsed.milestones
      .filter((m) => m.title && m.topicSlug && topicBySlug.has(m.topicSlug))
      .map((m, index) => {
        const topic = topicBySlug.get(m.topicSlug)!;
        return {
          topicId: String(topic._id),
          topicSlug: m.topicSlug,
          title: m.title,
          description: m.description,
          order: index,
          completed: false,
        };
      });

    if (milestones.length === 0) {
      throw new ValidationError("The AI returned an empty roadmap. Please try again.");
    }

    const saved = await roadmapRepository.upsert(userId, {
      level: parsed.level as RoadmapLevel,
      summary: parsed.summary,
      milestones,
    });

    return saved as unknown as IRoadmap;
  }

  async toggleMilestone(userId: string, order: number): Promise<IRoadmap> {
    const updated = await roadmapRepository.toggleMilestone(userId, order);
    if (!updated) throw new NotFoundError("Roadmap milestone");
    return updated as unknown as IRoadmap;
  }
}

export const roadmapService = new RoadmapService();
