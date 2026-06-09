"use client";

import Link from "next/link";
import { Loader2, BarChart3, AlertCircle } from "lucide-react";
import { useProgress } from "@/features/progress/hooks/useProgress";
import { ProgressStatCards } from "@/features/progress/components/ProgressStatCards";
import { ReadinessGauge } from "@/features/progress/components/ReadinessGauge";
import { TopicMasteryRadar } from "@/features/progress/components/TopicMasteryRadar";
import { RecentSessionsChart } from "@/features/progress/components/RecentSessionsChart";
import { WeakStrongAreas } from "@/features/progress/components/WeakStrongAreas";

export default function ProgressPage() {
  const { progress, sessions, isLoading, error } = useProgress();

  const hasData =
    !!progress &&
    ((progress.topicMastery?.length ?? 0) > 0 ||
      (progress.completedQuestions?.length ?? 0) > 0 ||
      (progress.readinessScore ?? 0) > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Your mastery, readiness, and focus areas across all topics.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground mt-3">Loading your progress...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <p className="text-sm font-medium text-foreground mt-3">Couldn&apos;t load progress</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <>
          <ProgressStatCards progress={progress!} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReadinessGauge score={progress!.readinessScore ?? 0} />
            <TopicMasteryRadar topicMastery={progress!.topicMastery ?? []} />
          </div>

          <WeakStrongAreas topicMastery={progress!.topicMastery ?? []} />

          <RecentSessionsChart sessions={sessions} />
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
      <p className="text-sm font-medium text-foreground mt-3">No progress yet</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
        Take a quiz or complete a mock interview and your mastery, readiness score, and focus
        areas will appear here.
      </p>
      <div className="flex items-center justify-center gap-3 mt-5">
        <Link
          href="/learn/quiz"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Take a Quiz
        </Link>
        <Link
          href="/learn/mock-interview"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
        >
          Mock Interview
        </Link>
      </div>
    </div>
  );
}
