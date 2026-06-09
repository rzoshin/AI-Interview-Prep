"use client";

import { RotateCcw, Trophy } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IInterviewSession, IQuestion, InterviewTurn } from "@/types";

interface InterviewSummaryProps {
  session: IInterviewSession;
  onRestart: () => void;
}

function turnQuestionText(turn: InterviewTurn): string {
  if (typeof turn.question === "object" && turn.question) {
    return (turn.question as IQuestion).question;
  }
  return "Question";
}

function tone(score: number): string {
  if (score >= 7) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 4) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

export function InterviewSummary({ session, onRestart }: InterviewSummaryProps) {
  const turns = session.turns ?? [];
  const total = session.totalScore ?? 0;
  const verdict =
    total >= 7 ? "Interview ready" : total >= 4 ? "Getting there" : "Needs practice";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Trophy className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground mt-3">Average score</p>
        <p className={cn("text-4xl font-bold mt-1", tone(total))}>
          {total}
          <span className="text-xl font-normal text-muted-foreground">/10</span>
        </p>
        <p className="text-sm font-medium text-foreground mt-1">{verdict}</p>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors mx-auto mt-5"
        >
          <RotateCcw className="w-4 h-4" />
          New interview
        </button>
      </div>

      <div className="space-y-4 mt-6">
        {turns.map((turn, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                {i + 1}. {turnQuestionText(turn)}
              </p>
              <span className={cn("text-sm font-bold tabular-nums shrink-0", tone(turn.score))}>
                {turn.score}/10
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              <span className="font-medium text-foreground">Your answer: </span>
              {turn.userAnswer}
            </p>
            {turn.feedback && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                <span className="font-medium text-foreground">Feedback: </span>
                {turn.feedback}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
