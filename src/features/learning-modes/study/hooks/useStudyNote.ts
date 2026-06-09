"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";

export type StudyVerdict = "correct" | "partial" | "incorrect";

export interface StudyNoteData {
  _id: string;
  questionId: string;
  content: string;
  evaluation?: {
    verdict: StudyVerdict;
    score: number;
    feedback: string;
    improvements: string[];
    evaluatedAt: string;
  };
  updatedAt: string;
}

export interface StudyEvaluationResult {
  verdict: StudyVerdict;
  score: number;
  feedback: string;
  improvements: string[];
  evaluatedAt: string;
}

interface NoteResponse {
  success: boolean;
  data: StudyNoteData | null;
}

const fetcher = async (url: string): Promise<NoteResponse> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to load note");
  }
  return json;
};

export function useStudyNote(questionId: string) {
  const { data, error, isLoading, mutate } = useSWR<NoteResponse>(
    questionId ? `/api/study/notes/${questionId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (data?.data && !initialized.current) {
      setContent(data.data.content);
      initialized.current = true;
    }
  }, [data?.data]);

  useEffect(() => {
    initialized.current = false;
    setContent("");
    setEvalError(null);
    setLastSaved(null);
  }, [questionId]);

  const saveNote = useCallback(
    async (text: string) => {
      setIsSaving(true);
      try {
        const res = await fetch(`/api/study/notes/${questionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to save note");
        }
        setLastSaved(new Date());
        await mutate();
      } finally {
        setIsSaving(false);
      }
    },
    [questionId, mutate]
  );

  const handleContentChange = useCallback(
    (text: string) => {
      setContent(text);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (text.trim()) saveNote(text);
      }, 800);
    },
    [saveNote]
  );

  const evaluate = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setEvalError("Write your answer before checking.");
      return;
    }

    setIsEvaluating(true);
    setEvalError(null);
    try {
      const res = await fetch(`/api/study/evaluate/${questionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Evaluation failed");
      }
      await mutate();
      return json.data as StudyEvaluationResult;
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  }, [content, questionId, mutate]);

  return {
    content,
    setContent: handleContentChange,
    evaluation: data?.data?.evaluation ?? null,
    isLoading,
    isSaving,
    isEvaluating,
    evalError,
    lastSaved,
    error: error instanceof Error ? error.message : null,
    evaluate,
    saveNote,
  };
}
