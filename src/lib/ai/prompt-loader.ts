import { promptRepository } from "@/repositories/prompt.repository";

export type PromptName = "answer" | "quiz" | "interview" | "roadmap";

export interface ActivePromptMeta {
  content: string;
  version: string;
  source: "db" | "fallback";
}

export async function getActivePromptContent(
  name: PromptName,
  fallback: () => string
): Promise<ActivePromptMeta> {
  try {
    const active = await promptRepository.findActiveByName(name);
    if (active?.content) {
      return { content: active.content, version: active.version, source: "db" };
    }
  } catch (error) {
    console.error(`[prompt-loader] failed to load "${name}":`, error);
  }

  return { content: fallback(), version: "fallback", source: "fallback" };
}
