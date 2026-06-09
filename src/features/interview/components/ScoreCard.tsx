"use client";

import { Lightbulb, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { InterviewEvaluationResult } from "@/types";

interface ScoreCardProps {
  result: InterviewEvaluationResult;
}

function scoreTone(score: number): string {
  if (score >= 7) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 4) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function barTone(score: number): string {
  if (score >= 7) return "bg-emerald-500";
  if (score >= 4) return "bg-amber-500";
  return "bg-rose-500";
}

export function ScoreCard({ result }: ScoreCardProps) {
  const pct = Math.round((result.score / 10) * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-muted-foreground">Score</p>
        <p className={cn("text-2xl font-bold tabular-nums", scoreTone(result.score))}>
          {result.score}
          <span className="text-base font-normal text-muted-foreground">/10</span>
        </p>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full transition-all", barTone(result.score))}
          style={{ width: `${pct}%` }}
        />
      </div>

      {result.feedback && (
        <p className="text-sm text-foreground leading-relaxed">{result.feedback}</p>
      )}

      {result.improvements.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            How to improve
          </p>
          <ul className="space-y-1.5">
            {result.improvements.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.followUps.length > 0 && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-primary" />
            Likely follow-ups
          </p>
          <ul className="space-y-1.5">
            {result.followUps.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span className="leading-relaxed">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
