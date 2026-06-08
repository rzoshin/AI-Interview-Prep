"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import type { ITopic } from "@/types/index";

interface ModeQuestionPickerProps {
  basePath: string; // e.g. "/learn/study" or "/learn/quiz"
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
}

const difficultyConfig = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

export function ModeQuestionPicker({
  basePath,
  icon,
  title,
  description,
  ctaLabel,
}: ModeQuestionPickerProps) {
  const [search, setSearch] = useState("");
  const { questions, isLoading } = useQuestions({
    search: search || undefined,
    page: 1,
    limit: 20,
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No questions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => {
            const topicName =
              typeof q.topic === "object" && q.topic !== null
                ? (q.topic as ITopic).name
                : null;
            return (
              <Link
                key={q._id}
                href={`${basePath}/${q._id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{q.question}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", difficultyConfig[q.difficulty])}>
                      {q.difficulty}
                    </span>
                    {topicName && (
                      <span className="text-xs text-muted-foreground">{topicName}</span>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-primary">
                  {ctaLabel}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
