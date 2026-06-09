"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TopicMastery } from "@/types";
import { masteryTopicName, masteryTopicSlug } from "../lib/topic-name";

interface WeakStrongAreasProps {
  topicMastery: TopicMastery[];
}

const WEAK_THRESHOLD = 50;
const STRONG_THRESHOLD = 75;

export function WeakStrongAreas({ topicMastery }: WeakStrongAreasProps) {
  const weak = topicMastery
    .filter((m) => m.score < WEAK_THRESHOLD)
    .sort((a, b) => a.score - b.score);
  const strong = topicMastery
    .filter((m) => m.score >= STRONG_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Bucket
        title="Focus Areas"
        subtitle="Topics scoring under 50%"
        icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
        items={weak}
        tone="weak"
        emptyText="No weak areas yet — keep it up!"
      />
      <Bucket
        title="Strong Areas"
        subtitle="Topics scoring 75% and above"
        icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
        items={strong}
        tone="strong"
        emptyText="Build mastery to unlock strong areas."
      />
    </div>
  );
}

function Bucket({
  title,
  subtitle,
  icon,
  items,
  tone,
  emptyText,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: TopicMastery[];
  tone: "weak" | "strong";
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/70 py-2">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((m, i) => {
            const name = masteryTopicName(m);
            const slug = masteryTopicSlug(m);
            const row = (
              <div className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-accent transition-colors group">
                <span className="text-sm text-foreground truncate">{name}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      tone === "weak" ? "text-rose-600" : "text-emerald-600"
                    )}
                  >
                    {m.score}%
                  </span>
                  {slug && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </span>
              </div>
            );
            return (
              <li key={`${name}-${i}`}>
                {slug ? <Link href={`/topics/${slug}`}>{row}</Link> : row}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
