export const ROADMAP_PROMPT_VERSION = "v1";

export interface RoadmapTopicInput {
  name: string;
  slug: string;
  mastery: number; // 0-100, 0 if untouched
}

export interface RoadmapPromptInput {
  topics: RoadmapTopicInput[];
  weakAreas: string[];
  strongAreas: string[];
  readinessScore: number;
  completedCount: number;
}

const SYSTEM_PROMPT = `You are an expert technical interview coach who designs personalized study roadmaps.
Given the learner's available topics and their current mastery, produce an ordered, step-by-step
learning path that takes them from their current level toward "interview ready".

Return ONLY a valid JSON object with EXACTLY these keys:
- "level": one of "beginner", "intermediate", "advanced", "interview-ready" — the learner's CURRENT overall level inferred from their mastery and readiness.
- "summary": a short (2-3 sentence) motivating overview of the plan and what to focus on first.
- "milestones": an ORDERED array (easiest/foundational first, advanced last) of 5-10 objects, each with:
  - "topicSlug": MUST be one of the provided topic slugs. Never invent slugs.
  - "title": a concise milestone title (e.g. "Master the fundamentals of Closures").
  - "description": 1-2 sentences explaining what to study and why it matters for interviews.

Rules:
- Front-load the learner's WEAK areas (low mastery) early in the path so they fix gaps first.
- Place already-strong topics later as quick reinforcement, or omit if clearly mastered.
- Only reference topic slugs from the provided list. Do not duplicate a topic.
- Do not wrap the JSON in markdown fences. Do not add keys other than those listed.`;

export function buildRoadmapPrompt({
  topics,
  weakAreas,
  strongAreas,
  readinessScore,
  completedCount,
}: RoadmapPromptInput): { system: string; user: string } {
  const topicLines = topics
    .map((t) => `- ${t.name} (slug: ${t.slug}) — mastery ${t.mastery}%`)
    .join("\n");

  const user = `Learner profile:
- Readiness score: ${readinessScore}%
- Questions completed: ${completedCount}
- Weak areas: ${weakAreas.length ? weakAreas.join(", ") : "none yet"}
- Strong areas: ${strongAreas.length ? strongAreas.join(", ") : "none yet"}

Available topics (only use these slugs):
${topicLines || "- (no topics available)"}

Design the personalized roadmap and return the JSON object now.`;

  return { system: SYSTEM_PROMPT, user };
}
