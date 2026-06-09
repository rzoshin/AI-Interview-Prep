"use client";

import { useEffect, useRef } from "react";

// Fire-and-forget: marks a question as completed once its content is ready
// (e.g. the AI answer has loaded). Records at most once per question id and
// silently ignores failures so it never disrupts the study UI.
export function useMarkStudied(questionId: string, ready: boolean) {
  const markedId = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !questionId) return;
    if (markedId.current === questionId) return;
    markedId.current = questionId;

    void fetch("/api/progress/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId }),
    }).catch(() => {
      // best-effort
    });
  }, [questionId, ready]);
}
