"use client";

import { Map as MapIcon, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RoadmapEmptyStateProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function RoadmapEmptyState({ onGenerate, isGenerating }: RoadmapEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <MapIcon className="h-10 w-10 text-muted-foreground/30 mx-auto" />
      <p className="text-sm font-medium text-foreground mt-3">No roadmap yet</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
        Generate a personalized, step-by-step learning path based on your progress and weak
        areas. It adapts as you practice.
      </p>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors mt-5",
          isGenerating && "opacity-60 cursor-not-allowed"
        )}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isGenerating ? "Generating your roadmap..." : "Generate My Roadmap"}
      </button>
    </div>
  );
}
