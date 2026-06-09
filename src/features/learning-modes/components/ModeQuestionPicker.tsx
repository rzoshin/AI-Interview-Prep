"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { useQuestions } from "@/features/questions/hooks/useQuestions";
import { ModeShell } from "@/components/shared/ModeShell";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ITopic } from "@/types/index";

interface ModeQuestionPickerProps {
  basePath: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
}

const difficultyVariant = {
  easy: "success" as const,
  medium: "warning" as const,
  hard: "destructive" as const,
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
    <ModeShell icon={icon} title={title} description={description} maxWidth="2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No questions found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const topicName =
              typeof q.topic === "object" && q.topic !== null
                ? (q.topic as ITopic).name
                : null;
            return (
              <Link key={q._id} href={`${basePath}/${q._id}`}>
                <Card className="hover:border-primary/30 hover:shadow-md transition-all group">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={difficultyVariant[q.difficulty]}>{q.difficulty}</Badge>
                        {topicName && (
                          <span className="text-xs text-muted-foreground">{topicName}</span>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-primary">
                      {ctaLabel}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </ModeShell>
  );
}
