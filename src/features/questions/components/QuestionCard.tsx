"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBookmark } from "../hooks/useBookmark";
import type { IQuestion, ITopic } from "@/types/index";

interface QuestionWithTopic extends Omit<IQuestion, "topic"> {
  topic: ITopic | string;
}

interface QuestionCardProps {
  question: QuestionWithTopic;
  initialBookmarked?: boolean;
}

const difficultyConfig = {
  easy: {
    label: "Easy",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  hard: {
    label: "Hard",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

export function QuestionCard({ question, initialBookmarked = false }: QuestionCardProps) {
  const { isBookmarked, isLoading, toggle } = useBookmark({
    questionId: question._id,
    initialBookmarked,
  });

  const topicName =
    typeof question.topic === "object" && question.topic !== null
      ? (question.topic as ITopic).name
      : "Unknown";

  const topicSlug =
    typeof question.topic === "object" && question.topic !== null
      ? (question.topic as ITopic).slug
      : "";

  const diff = difficultyConfig[question.difficulty];

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      {/* Difficulty + Topic row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", diff.className)}>
          {diff.label}
        </span>
        {topicSlug ? (
          <Link
            href={`/topics/${topicSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground hover:text-primary transition-colors bg-muted px-2 py-0.5 rounded-full"
          >
            {topicName}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {topicName}
          </span>
        )}
      </div>

      {/* Question text */}
      <Link href={`/questions/${question._id}`} className="flex-1">
        <p className="text-sm font-medium leading-relaxed text-foreground line-clamp-3 group-hover:text-primary transition-colors">
          {question.question}
        </p>
      </Link>

      {/* Tags */}
      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {question.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md"
            >
              #{tag}
            </span>
          ))}
          {question.tags.length > 4 && (
            <span className="text-xs text-muted-foreground">+{question.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer: actions */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <Link
          href={`/questions/${question._id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View answer
        </Link>

        <button
          onClick={toggle}
          disabled={isLoading}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          className={cn(
            "p-1.5 rounded-lg transition-all",
            isBookmarked
              ? "text-primary bg-primary/10 hover:bg-primary/20"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
