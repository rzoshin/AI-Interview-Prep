"use client";

import { Loader2, AlertCircle } from "lucide-react";
import { useRoadmap } from "@/features/roadmap/hooks/useRoadmap";
import { RoadmapTimeline } from "@/features/roadmap/components/RoadmapTimeline";
import { RoadmapEmptyState } from "@/features/roadmap/components/RoadmapEmptyState";

export default function RoadmapPage() {
  const { roadmap, isLoading, error, isGenerating, togglingOrder, generate, toggle } =
    useRoadmap();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Smart Roadmap</h1>
        <p className="text-muted-foreground mt-1">
          Your AI-generated, personalized path to interview readiness.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground mt-3">Loading your roadmap...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <p className="text-sm font-medium text-foreground mt-3">Couldn&apos;t load roadmap</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      ) : !roadmap ? (
        <RoadmapEmptyState onGenerate={generate} isGenerating={isGenerating} />
      ) : (
        <RoadmapTimeline
          roadmap={roadmap}
          togglingOrder={togglingOrder}
          onToggle={toggle}
          onRegenerate={generate}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
