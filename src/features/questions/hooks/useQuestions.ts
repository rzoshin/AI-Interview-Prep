"use client";

import useSWR from "swr";
import type { IQuestion, ITopic, Difficulty } from "@/types/index";
import type { PaginationMeta } from "@/types/api";

export interface QuestionWithTopic extends Omit<IQuestion, "topic"> {
  topic: ITopic | string;
}

interface QuestionsResponse {
  success: boolean;
  data: QuestionWithTopic[];
  meta: PaginationMeta;
}

interface UseQuestionsParams {
  topicId?: string;
  difficulty?: Difficulty | "";
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

function buildUrl(params: UseQuestionsParams): string {
  const qs = new URLSearchParams();
  if (params.topicId) qs.set("topic", params.topicId);
  if (params.difficulty) qs.set("difficulty", params.difficulty);
  if (params.search) qs.set("search", params.search);
  if (params.tags?.length) params.tags.forEach((t) => qs.append("tags", t));
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 20));
  return `/api/questions?${qs.toString()}`;
}

const fetcher = async (url: string): Promise<QuestionsResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json();
};

export function useQuestions(params: UseQuestionsParams = {}) {
  const url = buildUrl(params);

  const { data, error, isLoading, mutate } = useSWR<QuestionsResponse>(url, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  return {
    questions: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
    url,
  };
}
