"use client";

import useSWR from "swr";
import type { IInterviewSession, IProgress } from "@/types";

interface ProgressResponse {
  success: boolean;
  data: IProgress | null;
  error?: string;
}

interface SessionsResponse {
  success: boolean;
  data: IInterviewSession[] | null;
  error?: string;
}

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to load");
  }
  return json;
};

export function useProgress() {
  const {
    data: progressRes,
    error: progressErr,
    isLoading: progressLoading,
    mutate,
  } = useSWR<ProgressResponse>("/api/progress", fetcher, { revalidateOnFocus: false });

  const { data: sessionsRes, isLoading: sessionsLoading } = useSWR<SessionsResponse>(
    "/api/ai/interview?limit=10",
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    progress: progressRes?.data ?? null,
    sessions: sessionsRes?.data ?? [],
    isLoading: progressLoading || sessionsLoading,
    error: progressErr instanceof Error ? progressErr.message : null,
    mutate,
  };
}
