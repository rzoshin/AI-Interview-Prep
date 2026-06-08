"use client";

import { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import { QuestionCard } from "./QuestionCard";
import type { IQuestion, ITopic } from "@/types/index";
import { BookOpen } from "lucide-react";

interface QuestionWithTopic extends Omit<IQuestion, "topic"> {
  topic: ITopic | string;
}

interface QuestionListProps {
  questions: QuestionWithTopic[];
  isLoading?: boolean;
  bookmarkedIds?: Set<string>;
}

export function QuestionList({
  questions,
  isLoading = false,
  bookmarkedIds = new Set(),
}: QuestionListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <BookOpen className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No questions found</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Try adjusting your filters or search query to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {questions.map((question) => (
        <QuestionCard
          key={question._id}
          question={question}
          initialBookmarked={bookmarkedIds.has(question._id)}
        />
      ))}
    </div>
  );
}
