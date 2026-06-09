"use client";

import { BookOpen, Brain, TrendingUp, Zap } from "lucide-react";
import type { IProgress } from "@/types";

interface ProgressStatCardsProps {
  progress: IProgress;
}

export function ProgressStatCards({ progress }: ProgressStatCardsProps) {
  const mastery = progress.topicMastery ?? [];
  const avgMastery =
    mastery.length > 0
      ? Math.round(mastery.reduce((s, m) => s + m.score, 0) / mastery.length)
      : 0;

  const cards = [
    {
      label: "Readiness Score",
      value: `${progress.readinessScore ?? 0}%`,
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "Avg. Mastery",
      value: `${avgMastery}%`,
      icon: Brain,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Study Streak",
      value: `${progress.streakDays ?? 0} days`,
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Questions Completed",
      value: progress.completedQuestions?.length ?? 0,
      icon: BookOpen,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}
