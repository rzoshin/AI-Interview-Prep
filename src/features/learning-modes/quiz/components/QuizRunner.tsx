"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTopicQuiz } from "../hooks/useTopicQuiz";
import { useRecordQuiz } from "../hooks/useRecordQuiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion } from "@/types/index";

interface QuizRunnerProps {
  topicId: string;
}

const SECONDS_PER_QUESTION = 30;

export function QuizRunner({ topicId }: QuizRunnerProps) {
  const { quiz, topicName, isLoading, isRegenerating, error, retry, regenerate } =
    useTopicQuiz(topicId);

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Header topicName={null} />
        <div className="rounded-xl border border-border bg-card p-8 text-center mt-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Generating your quiz...</p>
            <p className="text-xs text-muted-foreground">This can take a few seconds.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || quiz.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Header topicName={topicName} />
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center mt-4">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-medium text-foreground">Couldn&apos;t generate the quiz</p>
            <p className="text-xs text-muted-foreground max-w-md">
              {error ?? "No quiz questions were produced. Please try again."}
            </p>
            <Button onClick={() => retry()}>
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Key by quiz identity so a regenerated quiz resets the game state.
  const quizKey = `${quiz.length}-${quiz[0]?.question ?? ""}`;

  return (
    <QuizGame
      key={quizKey}
      quiz={quiz}
      topicId={topicId}
      topicName={topicName}
      onRegenerate={regenerate}
      isRegenerating={isRegenerating}
    />
  );
}

function QuizGame({
  quiz,
  topicId,
  topicName,
  onRegenerate,
  isRegenerating,
}: {
  quiz: QuizQuestion[];
  topicId: string;
  topicName: string | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const recordQuiz = useRecordQuiz(topicId);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    new Array(quiz.length).fill(null)
  );
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);

  // Record the result into progress once, when the quiz transitions to finished.
  useEffect(() => {
    if (!finished) return;
    const correct = answers.reduce<number>(
      (acc, a, i) => (a === quiz[i].correctIndex ? acc + 1 : acc),
      0
    );
    void recordQuiz(correct, quiz.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const goNext = useCallback(() => {
    setCurrent((c) => {
      if (c + 1 >= quiz.length) {
        setFinished(true);
        return c;
      }
      return c + 1;
    });
    setTimeLeft(SECONDS_PER_QUESTION);
  }, [quiz.length]);

  // Per-question countdown; auto-advances when it hits zero.
  useEffect(() => {
    if (finished) return;
    if (timeLeft <= 0) {
      goNext();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finished, goNext]);

  function select(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[current] = optionIndex;
      return next;
    });
  }

  function reset() {
    setAnswers(new Array(quiz.length).fill(null));
    setCurrent(0);
    setFinished(false);
    setTimeLeft(SECONDS_PER_QUESTION);
  }

  if (finished) {
    const score = answers.reduce<number>(
      (acc, a, i) => (a === quiz[i].correctIndex ? acc + 1 : acc),
      0
    );
    const pct = Math.round((score / quiz.length) * 100);

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Header topicName={topicName} onRegenerate={onRegenerate} isRegenerating={isRegenerating} />
        <Card className="mt-4">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Your score</p>
            <p className="text-5xl font-bold text-foreground mt-2">
              {score}/{quiz.length}
            </p>
            <Badge
              variant={pct >= 70 ? "success" : pct >= 40 ? "warning" : "destructive"}
              className="mt-3"
            >
              {pct}%
            </Badge>
            <Button onClick={reset} className="mx-auto mt-6">
              <RefreshCw className="w-4 h-4" />
              Retry Quiz
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 mt-6">
          {quiz.map((q, i) => {
            const picked = answers[i];
            const correct = q.correctIndex;
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground mb-3">
                  {i + 1}. {q.question}
                </p>
                <ul className="space-y-1.5">
                  {q.options.map((opt, j) => {
                    const isCorrect = j === correct;
                    const isPicked = j === picked;
                    return (
                      <li
                        key={j}
                        className={cn(
                          "flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-md",
                          isCorrect &&
                            "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium",
                          isPicked && !isCorrect &&
                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                          !isCorrect && !isPicked && "text-muted-foreground"
                        )}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : isPicked ? (
                          <XCircle className="w-4 h-4 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 shrink-0" />
                        )}
                        {String.fromCharCode(65 + j)}. {opt}
                      </li>
                    );
                  })}
                </ul>
                {q.explanation && (
                  <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = quiz[current];
  const picked = answers[current];
  const progress = ((current + (picked !== null ? 1 : 0)) / quiz.length) * 100;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Header topicName={topicName} onRegenerate={onRegenerate} isRegenerating={isRegenerating} />

      {/* Progress + timer */}
      <div className="flex items-center gap-3 mt-4 mb-4">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
            timeLeft <= 5 ? "text-rose-600" : "text-muted-foreground"
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          {timeLeft}s
        </span>
      </div>

      <Card>
        <CardContent className="p-5">
          <Badge variant="secondary" className="mb-3">
            Question {current + 1} of {quiz.length}
          </Badge>
          <p className="text-base font-semibold text-foreground mb-4">{q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, j) => (
              <button
                key={j}
                onClick={() => select(j)}
                className={cn(
                  "w-full text-left text-sm px-4 py-3 rounded-xl border transition-all",
                  picked === j
                    ? "border-primary bg-primary/10 text-foreground font-medium shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-accent text-foreground"
                )}
              >
                {String.fromCharCode(65 + j)}. {opt}
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-5">
            <Button onClick={goNext} disabled={picked === null}>
              {current + 1 >= quiz.length ? "Finish" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Header({
  topicName,
  onRegenerate,
  isRegenerating,
}: {
  topicName: string | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/learn/quiz" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="w-4 h-4" />
        All quizzes
      </Link>
      <div className="flex items-center gap-2">
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-border text-foreground hover:bg-accent transition-colors",
              isRegenerating && "opacity-60 cursor-not-allowed"
            )}
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isRegenerating ? "Generating..." : "New quiz"}
          </button>
        )}
        <Badge className="gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          {topicName ? `${topicName} Quiz` : "Quiz"}
        </Badge>
      </div>
    </div>
  );
}

const primaryBtn =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors";
