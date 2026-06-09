"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { IInterviewSession } from "@/types";

interface RecentSessionsChartProps {
  sessions: IInterviewSession[];
}

function tone(score: number): string {
  if (score >= 7) return "#10b981";
  if (score >= 4) return "#f59e0b";
  return "#f43f5e";
}

export function RecentSessionsChart({ sessions }: RecentSessionsChartProps) {
  const completed = sessions
    .filter((s) => s.status === "completed")
    .slice(0, 8)
    .reverse();

  const data = completed.map((s, i) => ({
    name: `#${i + 1}`,
    score: s.totalScore ?? 0,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-semibold mb-1">Interview Scores</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Your most recent mock interview results (out of 10).
      </p>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-muted-foreground">No completed interviews yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Finish a mock interview to see your scores here.
          </p>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--color-accent)" }}
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={tone(d.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
