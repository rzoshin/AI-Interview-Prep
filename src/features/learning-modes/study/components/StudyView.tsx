"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, Sparkles, Loader2, AlertCircle, RefreshCw, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAIAnswer } from "@/features/ai-answer/hooks/useAIAnswer";
import { AnswerTabs } from "@/features/ai-answer/components/AnswerTabs";
import type { IQuestion, ITopic } from "@/types/index";

interface StudyViewProps {
  id: string;
}

interface QuestionResponse {
  success: boolean;
  data: (Omit<IQuestion, "topic"> & { topic: ITopic | string }) | null;
}

const difficultyConfig = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const fetcher = async (url: string): Promise<QuestionResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch question");
  return res.json();
};

export function StudyView({ id }: StudyViewProps) {
  const { data, isLoading: questionLoading } = useSWR<QuestionResponse>(
    `/api/questions/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  const question = data?.data;

  const { answer, isLoading: answerLoading, isGenerating, error, generate } = useAIAnswer(id);

  if (questionLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-6 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Link href="/questions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to questions
        </Link>
        <p className="text-muted-foreground">Question not found.</p>
      </div>
    );
  }

  const topicName =
    typeof question.topic === "object" && question.topic !== null
      ? (question.topic as ITopic).name
      : null;
  const topicId =
    typeof question.topic === "object" && question.topic !== null
      ? (question.topic as ITopic)._id
      : (question.topic as string);

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <Link href="/questions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to questions
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          <GraduationCap className="w-3.5 h-3.5" />
          Study Mode
        </span>
      </div>

      {/* Question header */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", difficultyConfig[question.difficulty])}>
            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
          </span>
          {topicName && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{topicName}</span>
          )}
        </div>
        <h1 className="text-xl font-bold text-foreground leading-relaxed">{question.question}</h1>
        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {question.tags.map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {answerLoading ? (
        <div className="space-y-3">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
        </div>
      ) : answer ? (
        <>
          <AnswerTabs answer={answer} />
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href={`/learn/quiz/${topicId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              {topicName ? `Quiz on ${topicName}` : "Take a Quiz"}
            </Link>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Generating AI answer...</p>
              <p className="text-xs text-muted-foreground">This can take up to a minute.</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-sm font-medium text-foreground">Generation failed</p>
              <p className="text-xs text-muted-foreground max-w-md">{error}</p>
              <button
                onClick={() => generate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <p className="text-sm font-medium text-foreground">No AI answer yet</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Generate a layered explanation (ELI5 to senior level), code example, and quiz to study this question.
              </p>
              <button
                onClick={() => generate()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Answer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
