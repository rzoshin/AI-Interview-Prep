"use client";

import { useCallback } from "react";

// Fire-and-forget recording of a topic quiz result into the user's progress.
// Silently ignores failures (e.g. unauthenticated) so it never disrupts the UI.
export function useRecordQuiz(topicId: string) {
  return useCallback(
    async (correct: number, total: number) => {
      if (!topicId || total <= 0) return;
      try {
        await fetch("/api/progress/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, correct, total }),
        });
      } catch {
        // best-effort
      }
    },
    [topicId]
  );
}
