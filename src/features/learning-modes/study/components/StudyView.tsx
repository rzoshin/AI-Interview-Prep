"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  CheckCircle2,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAIAnswer } from "@/features/ai-answer/hooks/useAIAnswer";
import { AnswerTabs } from "@/features/ai-answer/components/AnswerTabs";
import { useMarkStudied } from "@/features/progress/hooks/useMarkStudied";
import { useStudyNote } from "../hooks/useStudyNote";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { IQuestion, ITopic } from "@/types/index";
import type { StudyVerdict } from "../hooks/useStudyNote";

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

const verdictConfig: Record<
  StudyVerdict,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  correct: { label: "Correct", variant: "success" },
  partial: { label: "Partially correct", variant: "warning" },
  incorrect: { label: "Incorrect", variant: "destructive" },
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
  const {
    content,
    setContent,
    evaluation,
    isSaving,
    isEvaluating,
    evalError,
    lastSaved,
    evaluate,
  } = useStudyNote(id);

  useMarkStudied(id, !!answer);

  if (questionLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-6 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
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
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/learn/study" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" />
          Back to study
        </Link>
        <Badge variant="secondary" className="gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          Study Mode
        </Badge>
      </div>

      <Card>
        <CardContent className="p-5">
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
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Answer panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PenLine className="w-5 h-5 text-primary" />
              My Answer
            </CardTitle>
            <CardDescription>
              Type your answer in your own words. It auto-saves and you can get AI feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your answer here before peeking at the AI explanation..."
              className="min-h-[200px] flex-1"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-muted-foreground">
                {isSaving ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                ) : lastSaved ? (
                  `Saved ${lastSaved.toLocaleTimeString()}`
                ) : (
                  "Auto-saves as you type"
                )}
              </div>
              <Button onClick={() => evaluate()} disabled={isEvaluating || !content.trim()}>
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Check my answer
                  </>
                )}
              </Button>
            </div>

            {evalError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {evalError}
              </div>
            )}

            {evaluation && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant={verdictConfig[evaluation.verdict].variant}>
                    {verdictConfig[evaluation.verdict].label}
                  </Badge>
                  <span className="text-sm font-medium">Score: {evaluation.score}/10</span>
                </div>
                <p className="text-sm text-foreground">{evaluation.feedback}</p>
                {evaluation.improvements.length > 0 && (
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {evaluation.improvements.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground">
                  Evaluated {new Date(evaluation.evaluatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Reference panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Reference
            </CardTitle>
            <CardDescription>Layered explanations from ELI5 to senior level.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {answerLoading ? (
              <div className="space-y-3">
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                <div className="h-32 bg-muted rounded-xl animate-pulse" />
              </div>
            ) : answer ? (
              <AnswerTabs answer={answer} />
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-medium">Generating AI answer...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-rose-500" />
                    <p className="text-sm font-medium">Generation failed</p>
                    <p className="text-xs text-muted-foreground max-w-md">{error}</p>
                    <Button onClick={() => generate()}>
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <p className="text-sm font-medium">No AI answer yet</p>
                    <p className="text-xs text-muted-foreground max-w-md">
                      Generate a reference answer after you try on your own.
                    </p>
                    <Button onClick={() => generate()}>
                      <Sparkles className="w-4 h-4" />
                      Generate AI Answer
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {answer && (
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/learn/quiz/${topicId}`}>
              <GraduationCap className="w-4 h-4" />
              {topicName ? `Quiz on ${topicName}` : "Take a Quiz"}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
