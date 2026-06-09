"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils/cn";
import type { MasteryLevel } from "@/services/knowledge-graph.service";

export interface TopicNodeData {
  label: string;
  slug: string;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  questionCount: number;
}

const LEVEL_STYLES: Record<MasteryLevel, string> = {
  none: "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
  weak: "border-rose-400/60 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  building: "border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  strong: "border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

function TopicNodeComponent({ data }: NodeProps<TopicNodeData>) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 px-4 py-3 min-w-[160px] shadow-sm cursor-pointer transition-shadow hover:shadow-md",
        LEVEL_STYLES[data.masteryLevel]
      )}
      title={`${data.label} — ${data.masteryScore}% mastery · ${data.questionCount} questions`}
    >
      <Handle type="target" position={Position.Top} className="!bg-border !w-2 !h-2" />
      <p className="font-semibold text-sm leading-tight">{data.label}</p>
      <div className="flex items-center justify-between mt-2 text-xs opacity-80">
        <span>{data.masteryScore > 0 ? `${data.masteryScore}%` : "Not started"}</span>
        <span>{data.questionCount} Q</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border !w-2 !h-2" />
    </div>
  );
}

export const TopicNode = memo(TopicNodeComponent);
