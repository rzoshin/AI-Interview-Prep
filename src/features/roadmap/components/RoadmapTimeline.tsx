"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IRoadmap } from "@/types";
import { MilestoneCard } from "./MilestoneCard";

interface RoadmapTimelineProps {
  roadmap: IRoadmap;
  togglingOrder: number | null;
  onToggle: (order: number) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  "interview-ready": "Interview Ready",
};

export function RoadmapTimeline({
  roadmap,
  togglingOrder,
  onToggle,
  onRegenerate,
  isGenerating,
}: RoadmapTimelineProps) {
  const milestones = [...roadmap.milestones].sort((a, b) => a.order - b.order);
  const completed = milestones.filter((m) => m.completed).length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {LEVEL_LABEL[roadmap.level] ?? roadmap.level}
              </span>
              <span className="text-xs text-muted-foreground">
                {completed}/{total} milestones complete
              </span>
            </div>
            {roadmap.summary && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">
                {roadmap.summary}
              </p>
            )}
          </div>
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-accent transition-colors shrink-0",
              isGenerating && "opacity-60 cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isGenerating ? "Generating..." : "Regenerate"}
          </button>
        </div>

        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="pl-1">
        {milestones.map((m, i) => (
          <MilestoneCard
            key={m.order}
            milestone={m}
            index={i}
            total={total}
            isToggling={togglingOrder === m.order}
            onToggle={onToggle}
          />
        ))}
      </ol>
    </div>
  );
}
