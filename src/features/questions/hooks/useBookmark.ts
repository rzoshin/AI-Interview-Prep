"use client";

import { useState, useCallback } from "react";

interface UseBookmarkOptions {
  questionId: string;
  initialBookmarked?: boolean;
}

interface UseBookmarkResult {
  isBookmarked: boolean;
  isLoading: boolean;
  toggle: () => Promise<void>;
}

export function useBookmark({
  questionId,
  initialBookmarked = false,
}: UseBookmarkOptions): UseBookmarkResult {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (isLoading) return;

    const prev = isBookmarked;
    setIsBookmarked(!prev);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/questions/${questionId}/bookmark`, {
        method: prev ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        // Rollback on failure
        setIsBookmarked(prev);
      }
    } catch {
      setIsBookmarked(prev);
    } finally {
      setIsLoading(false);
    }
  }, [questionId, isBookmarked, isLoading]);

  return { isBookmarked, isLoading, toggle };
}

export async function fetchBookmarkStatus(questionId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/questions/${questionId}/bookmark`);
    if (!res.ok) return false;
    const json = await res.json();
    return json.data?.bookmarked ?? false;
  } catch {
    return false;
  }
}
