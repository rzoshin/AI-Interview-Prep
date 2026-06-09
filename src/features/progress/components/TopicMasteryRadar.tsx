"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { TopicMastery } from "@/types";
import { masteryTopicName } from "../lib/topic-name";

interface TopicMasteryRadarProps {
  topicMastery: TopicMastery[];
}

export function TopicMasteryRadar({ topicMastery }: TopicMasteryRadarProps) {
  const data = topicMastery.map((m) => ({
    topic: masteryTopicName(m),
    score: m.score,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-semibold mb-1">Topic Mastery</h2>
      <p className="text-xs text-muted-foreground mb-2">Your strength across topics (0-100).</p>

      {data.length < 3 ? (
        <div className="space-y-3 py-2">
          {data.map((d) => (
            <div key={d.topic}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">{d.topic}</span>
                <span className="text-muted-foreground tabular-nums">{d.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${d.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="70%">
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="topic"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="score"
                stroke="var(--color-primary)"
                fill="var(--color-primary)"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
