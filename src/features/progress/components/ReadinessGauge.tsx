"use client";

import {
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface ReadinessGaugeProps {
  score: number;
}

function tone(score: number): string {
  if (score >= 75) return "#10b981"; // emerald
  if (score >= 50) return "#f59e0b"; // amber
  return "#f43f5e"; // rose
}

function label(score: number): string {
  if (score >= 80) return "Interview Ready";
  if (score >= 60) return "Almost There";
  if (score >= 40) return "Building Up";
  if (score > 0) return "Getting Started";
  return "Not Started";
}

export function ReadinessGauge({ score }: ReadinessGaugeProps) {
  const data = [{ name: "readiness", value: score, fill: tone(score) }];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="font-semibold mb-1">Readiness Score</h2>
      <p className="text-xs text-muted-foreground mb-2">
        Weighted blend of mastery, interview performance, and coverage.
      </p>
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={16} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold" style={{ color: tone(score) }}>
            {score}%
          </span>
          <span className="text-xs text-muted-foreground mt-1">{label(score)}</span>
        </div>
      </div>
    </div>
  );
}
