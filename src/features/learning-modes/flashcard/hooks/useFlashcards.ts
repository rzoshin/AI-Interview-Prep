"use client";

import useSWR from "swr";
import type { IQuestion, ITopic } from "@/types/index";
import type { PaginationMeta } from "@/types/api";

export interface FlashcardQuestion extends Omit<IQuestion, "topic"> {
  topic: ITopic | string;
}

interface QuestionsResponse {
  success: boolean;
  data: FlashcardQuestion[];
  meta?: PaginationMeta;
}

const fetcher = async (url: string): Promise<QuestionsResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch flashcards");
  return res.json();
};

export function useFlashcards(topicId: string) {
  const key = topicId ? `/api/questions?topic=${topicId}&limit=50` : null;
  const { data, error, isLoading } = useSWR<QuestionsResponse>(key, fetcher, {
    revalidateOnFocus: false,
  });

  const cards = data?.data ?? [];
  const first = cards[0];
  const topicName =
    first && typeof first.topic === "object" && first.topic !== null
      ? (first.topic as ITopic).name
      : null;

  return {
    cards,
    topicName,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
