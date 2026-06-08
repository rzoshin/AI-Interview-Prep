"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { IAIAnswer } from "@/types/index";

interface AnswerResponse {
  success: boolean;
  data: IAIAnswer | null;
  error?: string;
}

const fetcher = async (url: string): Promise<AnswerResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch answer");
  return res.json();
};

export function useAIAnswer(questionId: string) {
  const key = questionId ? `/api/ai/answers/${questionId}` : null;
  const { data, error, isLoading, mutate } = useSWR<AnswerResponse>(key, fetcher, {
    revalidateOnFocus: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function generate(force = false) {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(
        `/api/ai/generate/${questionId}${force ? "?force=true" : ""}`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Generation failed");
      }
      await mutate({ success: true, data: json.data }, { revalidate: false });
      toast.success("AI answer generated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      setGenerateError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }

  return {
    answer: data?.data ?? null,
    isLoading,
    isGenerating,
    error: generateError ?? (error instanceof Error ? error.message : null),
    generate,
  };
}
