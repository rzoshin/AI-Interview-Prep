"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import type { IRoadmap } from "@/types";

interface RoadmapResponse {
  success: boolean;
  data: IRoadmap | null;
  error?: string;
}

const fetcher = async (url: string): Promise<RoadmapResponse> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to load roadmap");
  }
  return json;
};

export function useRoadmap() {
  const { data, error, isLoading, mutate } = useSWR<RoadmapResponse>(
    "/api/ai/roadmap",
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [togglingOrder, setTogglingOrder] = useState<number | null>(null);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/roadmap", { method: "POST" });
      const json: RoadmapResponse = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || "Failed to generate roadmap");
      }
      await mutate(json, { revalidate: false });
      toast.success("Your roadmap is ready");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate roadmap");
    } finally {
      setIsGenerating(false);
    }
  }, [mutate]);

  const toggle = useCallback(
    async (order: number) => {
      setTogglingOrder(order);
      try {
        const res = await fetch("/api/ai/roadmap/milestone", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        });
        const json: RoadmapResponse = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || "Failed to update milestone");
        }
        await mutate(json, { revalidate: false });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update milestone");
      } finally {
        setTogglingOrder(null);
      }
    },
    [mutate]
  );

  return {
    roadmap: data?.data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : null,
    isGenerating,
    togglingOrder,
    generate,
    toggle,
  };
}
