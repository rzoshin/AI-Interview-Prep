"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  Difficulty,
  IInterviewSession,
  InterviewEvaluationResult,
  InterviewQuestion,
} from "@/types";

export type InterviewPhase = "config" | "question" | "result" | "summary";

export interface StartOptions {
  topicId?: string;
  difficulty?: Difficulty;
  questionCount: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.success || json.data == null) {
    throw new Error(json.error || "Request failed");
  }
  return json.data;
}

export function useInterview() {
  const [phase, setPhase] = useState<InterviewPhase>("config");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<InterviewEvaluationResult[]>([]);
  const [lastResult, setLastResult] = useState<InterviewEvaluationResult | null>(null);
  const [finalSession, setFinalSession] = useState<IInterviewSession | null>(null);

  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const start = useCallback(async (opts: StartOptions) => {
    setIsStarting(true);
    try {
      const data = await postJson<{ session: IInterviewSession; questions: InterviewQuestion[] }>(
        "/api/ai/interview",
        opts
      );
      setSessionId(data.session._id);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setResults([]);
      setLastResult(null);
      setFinalSession(null);
      setPhase("question");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start interview");
    } finally {
      setIsStarting(false);
    }
  }, []);

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!sessionId) return;
      const question = questions[currentIndex];
      if (!question) return;

      setIsSubmitting(true);
      try {
        const result = await postJson<InterviewEvaluationResult>(
          `/api/ai/interview/${sessionId}/answer`,
          { questionId: question._id, answer }
        );
        setResults((prev) => [...prev, result]);
        setLastResult(result);
        setPhase("result");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to evaluate answer");
      } finally {
        setIsSubmitting(false);
      }
    },
    [sessionId, questions, currentIndex]
  );

  const complete = useCallback(async () => {
    if (!sessionId) return;
    setIsCompleting(true);
    try {
      const data = await postJson<IInterviewSession>(`/api/ai/interview/${sessionId}/complete`);
      setFinalSession(data);
      setPhase("summary");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to complete interview");
    } finally {
      setIsCompleting(false);
    }
  }, [sessionId]);

  const next = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      void complete();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setLastResult(null);
    setPhase("question");
  }, [currentIndex, questions.length, complete]);

  const reset = useCallback(() => {
    setPhase("config");
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setResults([]);
    setLastResult(null);
    setFinalSession(null);
  }, []);

  return {
    phase,
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex] ?? null,
    results,
    lastResult,
    finalSession,
    isStarting,
    isSubmitting,
    isCompleting,
    isLastQuestion: currentIndex + 1 >= questions.length,
    start,
    submitAnswer,
    next,
    complete,
    reset,
  };
}
