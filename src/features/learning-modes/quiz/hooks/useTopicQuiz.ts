"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { QuizQuestion } from "@/types/index";

interface TopicQuizResponse {
  success: boolean;
  data: { topicName: string; quiz: QuizQuestion[] } | null;
  error?: string;
}

const fetcher = async (url: string): Promise<TopicQuizResponse> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to generate quiz");
  }
  return json;
};

export function useTopicQuiz(topicId: string) {
  const key = topicId ? `/api/ai/quiz/${topicId}` : null;
  const { data, error, isLoading, mutate } = useSWR<TopicQuizResponse>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const [isRegenerating, setIsRegenerating] = useState(false);

  async function regenerate() {
    if (!topicId) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/ai/quiz/${topicId}?force=true`);
      const json: TopicQuizResponse = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to regenerate quiz");
      }
      await mutate(json, { revalidate: false });
      toast.success("Fresh quiz generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate quiz");
    } finally {
      setIsRegenerating(false);
    }
  }

  return {
    topicName: data?.data?.topicName ?? null,
    quiz: data?.data?.quiz ?? [],
    isLoading,
    isRegenerating,
    error: error instanceof Error ? error.message : null,
    retry: () => mutate(),
    regenerate,
  };
}
