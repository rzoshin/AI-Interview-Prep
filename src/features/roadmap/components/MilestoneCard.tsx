"use client";

import Link from "next/link";
import { Check, Circle, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RoadmapMilestone } from "@/types";

interface MilestoneCardProps {
  milestone: RoadmapMilestone;
  index: number;
  total: number;
  isToggling: boolean;
  onToggle: (order: number) => void;
}

export function MilestoneCard({
  milestone,
  index,
  total,
  isToggling,
  onToggle,
}: MilestoneCardProps) {
  const isLast = index === total - 1;

  return (
    <li className="relative flex gap-4 pb-6">
      {/* Timeline connector */}
      {!isLast && (
        <span
          className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
          aria-hidden="true"
        />
      )}

      <button
        onClick={() => onToggle(milestone.order)}
        disabled={isToggling}
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          milestone.completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border bg-card text-muted-foreground hover:border-primary"
        )}
        aria-label={milestone.completed ? "Mark incomplete" : "Mark complete"}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : milestone.completed ? (
          <Check className="h-4 w-4" />
        ) : (
          <Circle className="h-3 w-3" />
        )}
      </button>

      <div
        className={cn(
          "flex-1 rounded-xl border border-border bg-card p-4 transition-opacity",
          milestone.completed && "opacity-70"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Step {index + 1}</p>
            <h3
              className={cn(
                "font-semibold text-foreground mt-0.5",
                milestone.completed && "line-through"
              )}
            >
              {milestone.title}
            </h3>
          </div>
        </div>
        {milestone.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {milestone.description}
          </p>
        )}
        {milestone.topicSlug && (
          <Link
            href={`/topics/${milestone.topicSlug}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-3"
          >
            Study this topic
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
}
