"use client";

import useSWR from "swr";
import type { KnowledgeGraphData } from "@/services/knowledge-graph.service";

interface GraphResponse {
  success: boolean;
  data: KnowledgeGraphData;
  error?: string;
}

const fetcher = async (url: string): Promise<GraphResponse> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to load knowledge graph");
  }
  return json;
};

export function useKnowledgeGraph() {
  const { data, error, isLoading, mutate } = useSWR<GraphResponse>(
    "/api/knowledge-graph",
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    graph: data?.data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    mutate,
  };
}
